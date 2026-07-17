#!/usr/bin/env node
// Extract a per-conversation feature dataset from all Claude Code transcripts.
// Sources: ~/.claude/projects/**/*.jsonl  (live)  merged with the ai-agent
// archive at services/ai-agent/data/transcripts (dedup by session id = filename).
// Costs are computed with APPE's own Anthropic catalogue prices so the empirical
// numbers are internally consistent with what APPE will estimate.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";

const HOME = os.homedir();
const SRC_DIRS = [
  path.join(HOME, ".claude/projects"),
  path.join(HOME, "homelab/services/ai-agent/data/transcripts"),
];
const META_PATH = path.join(
  HOME,
  "homelab/services/ai-agent/data/conversations-meta.json"
);
const APPE_MODELS = path.join(
  HOME,
  "projects/appe/packages/core/src/data/models.json"
);
const OUT = process.argv[2] || "/tmp/appe-agentic-dataset.json";

// ---- pricing ($/Mtok) from APPE catalogue, keyed by model id short name ----
const catalogue = JSON.parse(fs.readFileSync(APPE_MODELS, "utf8"));
const priceByModel = {};
for (const m of catalogue) {
  if (m.provider !== "anthropic") continue;
  const short = m.id.replace(/^anthropic\//, "");
  priceByModel[short] = {
    input: m.input_cost, // $/Mtok
    output: m.output_cost,
    cacheRead: m.cache_cost ?? m.input_cost * 0.1,
  };
}
// cache-write rate = 1.25x input (5m TTL, Anthropic default). Fable/opus etc.
function priceFor(model) {
  if (!model) return null;
  // exact, then family fallback
  if (priceByModel[model]) return priceByModel[model];
  const fam = Object.keys(priceByModel).find((k) => model.startsWith(k));
  if (fam) return priceByModel[fam];
  // sensible fallbacks for non-anthropic / unknown (treat as opus-class)
  if (/opus/.test(model)) return priceByModel["claude-opus-4-8"];
  if (/sonnet/.test(model)) return priceByModel["claude-sonnet-5"];
  if (/haiku/.test(model)) return priceByModel["claude-haiku-4-5"];
  if (/fable/.test(model)) return priceByModel["claude-fable-5"];
  return null;
}

function costOfUsage(model, u) {
  const p = priceFor(model);
  if (!p || !u) return 0;
  const inTok = u.input_tokens || 0;
  const out = u.output_tokens || 0;
  const cRead = u.cache_read_input_tokens || 0;
  const cWrite = u.cache_creation_input_tokens || 0;
  const M = 1e6;
  return (
    (inTok * p.input) / M +
    (out * p.output) / M +
    (cRead * p.cacheRead) / M +
    (cWrite * p.input * 1.25) / M
  );
}

// ---- load meta (project tags, state) ----
let meta = {};
try {
  meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
} catch {}

// ---- gather transcript files, dedup by session id (filename stem) ----
const files = new Map(); // sid -> filepath (prefer live ~/.claude copy)
function walk(dir) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp);
    else if (e.name.endsWith(".jsonl") && !e.name.includes("subagent")) {
      const sid = e.name.replace(/\.jsonl$/, "");
      // skip subagent files (they live under a subagents/ dir)
      if (fp.includes("/subagents/")) continue;
      if (!files.has(sid)) files.set(sid, fp);
    }
  }
}
for (const d of SRC_DIRS) walk(d);

async function processFile(sid, fp) {
  const row = {
    sid,
    file: fp,
    cwd: null,
    project: null, // from cwd basename
    metaProjects: meta[sid]?.projects || [],
    state: meta[sid]?.state || null,
    firstPrompt: null,
    firstPromptLen: 0,
    userMsgs: 0, // real user turns (string prompts, not tool results)
    assistantMsgs: 0, // assistant records (one per model response chunk)
    assistantTurns: 0, // assistant records that are NOT pure tool-continuations
    toolCalls: 0,
    toolCounts: {},
    models: {},
    inTok: 0,
    outTok: 0,
    cacheReadTok: 0,
    cacheWriteTok: 0,
    cost: 0,
    tStart: null,
    tEnd: null,
    webSearch: 0,
    webFetch: 0,
    thinking: 0,
  };

  const rl = readline.createInterface({
    input: fs.createReadStream(fp),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      continue;
    }
    if (r.cwd && !row.cwd) row.cwd = r.cwd;
    if (r.timestamp) {
      const t = Date.parse(r.timestamp);
      if (!Number.isNaN(t)) {
        if (row.tStart === null || t < row.tStart) row.tStart = t;
        if (row.tEnd === null || t > row.tEnd) row.tEnd = t;
      }
    }

    if (r.type === "user") {
      const c = r.message?.content;
      if (typeof c === "string") {
        // real human prompt (not a tool_result, which is array content)
        // skip system-reminder-only / command wrappers heuristically
        row.userMsgs++;
        if (!row.firstPrompt && c.trim() && !c.startsWith("<")) {
          row.firstPrompt = c.slice(0, 500);
          row.firstPromptLen = c.length;
        }
      }
    } else if (r.type === "assistant") {
      row.assistantMsgs++;
      const model = r.message?.model;
      if (model) row.models[model] = (row.models[model] || 0) + 1;
      const u = r.message?.usage;
      if (u) {
        row.inTok += u.input_tokens || 0;
        row.outTok += u.output_tokens || 0;
        row.cacheReadTok += u.cache_read_input_tokens || 0;
        row.cacheWriteTok += u.cache_creation_input_tokens || 0;
        row.cost += costOfUsage(model, u);
        row.webSearch += u.server_tool_use?.web_search_requests || 0;
        row.webFetch += u.server_tool_use?.web_fetch_requests || 0;
      }
      const content = r.message?.content;
      let hadTool = false;
      let hadText = false;
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b.type === "tool_use") {
            hadTool = true;
            row.toolCalls++;
            row.toolCounts[b.name] = (row.toolCounts[b.name] || 0) + 1;
          } else if (b.type === "text" && b.text?.trim()) hadText = true;
          else if (b.type === "thinking") row.thinking++;
        }
      }
      if (hadText || !hadTool) row.assistantTurns++;
    }
  }

  // project from cwd basename, else metaProjects[0]
  if (row.cwd) row.project = path.basename(row.cwd);
  if ((!row.project || row.project === "homelab") && row.metaProjects.length)
    row.project = row.metaProjects[0];
  row.durationSec =
    row.tStart != null && row.tEnd != null
      ? Math.round((row.tEnd - row.tStart) / 1000)
      : null;
  row.totalTok =
    row.inTok + row.outTok + row.cacheReadTok + row.cacheWriteTok;
  row.primaryModel =
    Object.entries(row.models).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return row;
}

const rows = [];
let n = 0;
for (const [sid, fp] of files) {
  try {
    const row = await processFile(sid, fp);
    rows.push(row);
  } catch (e) {
    // ignore unreadable
  }
  if (++n % 100 === 0) process.stderr.write(`processed ${n}/${files.size}\n`);
}

fs.writeFileSync(OUT, JSON.stringify(rows, null, 0));
process.stderr.write(`\nWrote ${rows.length} conversations -> ${OUT}\n`);
