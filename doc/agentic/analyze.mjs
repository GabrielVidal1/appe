#!/usr/bin/env node
// Classify typology + complexity, then fit the agentic cost distribution.
// Input: /tmp/appe-agentic-dataset.json  (from extract.mjs)
// Output: /tmp/appe-agentic-model.json    (params for APPE)  + console report

import fs from "node:fs";

const rows = JSON.parse(fs.readFileSync("/tmp/appe-agentic-dataset.json", "utf8"));

// ---------- 1. filter to real, human-initiated coding conversations ----------
// drop: empty/near-empty, no assistant turns, test/scratchpad noise, and
// cron/agent runs with no human prompt. Keep genuine agent workflows.
const clean = rows.filter(
  (r) =>
    r.assistantMsgs >= 2 &&
    r.cost > 0.01 &&
    r.firstPrompt &&
    r.durationSec != null &&
    r.durationSec > 5 &&
    !/scratchpad|runner-test|runner-remap|fork-test/.test(r.file)
);

// ---------- 2. typology classification (prompt keywords + tool mix) ----------
const RE = {
  deploy: /\b(deploy|redeploy|ship|publish|release|rollout|bring up|restart)\b/i,
  bugfix: /\b(fix|bug|broken|error|crash|fails?|regression|doesn'?t work|not working|debug|wrong)\b/i,
  refactor: /\b(refactor|clean ?up|reorganize|restructure|split|simplify|extract)\b/i,
  research: /\b(analy[sz]e|investigate|research|figure out|explore|understand|why|estimate|plan|design|compare|audit|review)\b/i,
  feature: /\b(add|implement|build|create|new |support|introduce|make (a|an|it)|wire|integrate)\b/i,
  chore: /\b(update|bump|rename|move|tweak|adjust|change|set |configure|document|commit)\b/i,
};
function classify(r) {
  const p = r.firstPrompt || "";
  // order matters: specific -> general
  if (RE.deploy.test(p) && r.assistantMsgs < 30) return "deploy";
  if (RE.bugfix.test(p)) return "bugfix";
  if (RE.research.test(p) && r.toolCalls < r.assistantMsgs) return "research";
  if (RE.refactor.test(p)) return "refactor";
  if (RE.feature.test(p)) return "feature";
  if (RE.chore.test(p)) return "chore";
  return "other";
}

// ---------- 3. complexity score (continuous, 0..~1 normalized) -------------
// Complexity ~ how much work the agent did. Combine assistant turns, tool
// calls, distinct edits (Edit+Write), and duration into a robust score.
function editCount(r) {
  return (r.toolCounts.Edit || 0) + (r.toolCounts.Write || 0) + (r.toolCounts.MultiEdit || 0);
}
function complexity(r) {
  // log-scaled features, each ~0..1 over the corpus, then averaged.
  const f = (x, cap) => Math.min(1, Math.log10(1 + x) / Math.log10(1 + cap));
  const turns = f(r.assistantMsgs, 300);
  const tools = f(r.toolCalls, 200);
  const edits = f(editCount(r), 60);
  const dur = f(r.durationSec / 60, 240); // minutes, cap 4h
  return { score: (turns + tools + edits + dur) / 4, turns, tools, edits, dur };
}

for (const r of clean) {
  r.typology = classify(r);
  const c = complexity(r);
  r.cx = c.score;
  r.edits = editCount(r);
  // complexity buckets
  r.cxBucket = c.score < 0.33 ? "simple" : c.score < 0.55 ? "moderate" : "complex";
}

// ---------- helpers: robust stats ----------
const q = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
};
const stats = (arr) => ({
  n: arr.length,
  min: q(arr, 0), p10: q(arr, 0.1), p25: q(arr, 0.25), median: q(arr, 0.5),
  p75: q(arr, 0.75), p90: q(arr, 0.9), max: q(arr, 1),
  mean: arr.reduce((a, b) => a + b, 0) / (arr.length || 1),
});
// lognormal fit (cost is heavy-tailed positive) -> mu, sigma of ln(x)
const lognorm = (arr) => {
  const l = arr.filter((x) => x > 0).map(Math.log);
  const mu = l.reduce((a, b) => a + b, 0) / l.length;
  const sigma = Math.sqrt(l.reduce((a, b) => a + (b - mu) ** 2, 0) / l.length);
  return { mu, sigma, medianDollars: Math.exp(mu) };
};

// ---------- 4. distributions ----------
const report = { generatedAt: null, corpus: {}, byTypology: {}, byComplexity: {}, byProject: {}, drivers: {}, perTurn: {} };
report.corpus = {
  totalConversations: rows.length,
  usedConversations: clean.length,
  cost: stats(clean.map((r) => r.cost)),
  costLognormal: lognorm(clean.map((r) => r.cost)),
  assistantMsgs: stats(clean.map((r) => r.assistantMsgs)),
  toolCalls: stats(clean.map((r) => r.toolCalls)),
  durationMin: stats(clean.map((r) => r.durationSec / 60)),
  totalTokens: stats(clean.map((r) => r.totalTok)),
  cacheReadShare: stats(clean.map((r) => r.cacheReadTok / (r.totalTok || 1))),
};

const groupBy = (key) => {
  const g = {};
  for (const r of clean) {
    const k = typeof key === "function" ? key(r) : r[key];
    (g[k] ||= []).push(r);
  }
  return g;
};
function summarizeGroup(arr) {
  return {
    n: arr.length,
    cost: stats(arr.map((r) => r.cost)),
    costLognormal: lognorm(arr.map((r) => r.cost)),
    assistantMsgs: stats(arr.map((r) => r.assistantMsgs)),
    toolCalls: stats(arr.map((r) => r.toolCalls)),
    durationMin: stats(arr.map((r) => r.durationSec / 60)),
    costPerAssistantMsg: stats(arr.map((r) => r.cost / r.assistantMsgs)),
  };
}
for (const [k, v] of Object.entries(groupBy("typology"))) report.byTypology[k] = summarizeGroup(v);
for (const [k, v] of Object.entries(groupBy("cxBucket"))) report.byComplexity[k] = summarizeGroup(v);
const byProj = groupBy((r) => r.project || "unknown");
for (const [k, v] of Object.entries(byProj)) if (v.length >= 3) report.byProject[k] = summarizeGroup(v);

// ---------- 5. cost drivers: regression-ish (cost vs assistantMsgs) ----------
// Fit cost ≈ a * assistantMsgs^b  (log-log OLS) — the central relationship.
function powerFit(xs, ys) {
  const lx = xs.map(Math.log), ly = ys.map(Math.log);
  const n = lx.length;
  const mx = lx.reduce((a, b) => a + b, 0) / n, my = ly.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, sty = 0, ssr = 0;
  for (let i = 0; i < n; i++) { sxy += (lx[i]-mx)*(ly[i]-my); sxx += (lx[i]-mx)**2; }
  const b = sxy / sxx, la = my - b * mx;
  for (let i = 0; i < n; i++) { const pred = la + b*lx[i]; ssr += (ly[i]-pred)**2; sty += (ly[i]-my)**2; }
  return { a: Math.exp(la), b, r2: 1 - ssr/sty };
}
const withMsgs = clean.filter((r) => r.assistantMsgs > 0 && r.cost > 0);
report.drivers.costVsAssistantMsgs = powerFit(withMsgs.map((r) => r.assistantMsgs), withMsgs.map((r) => r.cost));
report.drivers.costVsToolCalls = powerFit(
  clean.filter((r) => r.toolCalls > 0).map((r) => r.toolCalls),
  clean.filter((r) => r.toolCalls > 0).map((r) => r.cost)
);
report.drivers.costVsDurationMin = powerFit(
  clean.filter((r) => r.durationSec > 30).map((r) => r.durationSec / 60),
  clean.filter((r) => r.durationSec > 30).map((r) => r.cost)
);
// tokens per assistant message (the atomic unit APPE can multiply by turns)
report.perTurn = {
  totalTokPerAssistantMsg: stats(clean.map((r) => r.totalTok / r.assistantMsgs)),
  outputTokPerAssistantMsg: stats(clean.map((r) => r.outTok / r.assistantMsgs)),
  cacheReadTokPerAssistantMsg: stats(clean.map((r) => r.cacheReadTok / r.assistantMsgs)),
  toolCallsPerAssistantMsg: stats(clean.map((r) => r.toolCalls / r.assistantMsgs)),
  costPerAssistantMsg: stats(clean.map((r) => r.cost / r.assistantMsgs)),
};

report.generatedAt = new Date().toISOString?.() || "n/a";
fs.writeFileSync("/tmp/appe-agentic-model.json", JSON.stringify(report, null, 2));
// also dump the classified rows for the plan
fs.writeFileSync("/tmp/appe-agentic-clean.json", JSON.stringify(clean.map(r=>({
  sid:r.sid.slice(0,8), project:r.project, typology:r.typology, cxBucket:r.cxBucket, cx:+r.cx.toFixed(3),
  cost:+r.cost.toFixed(2), assistantMsgs:r.assistantMsgs, toolCalls:r.toolCalls, edits:r.edits,
  durationMin:Math.round(r.durationSec/60), totalTokM:+(r.totalTok/1e6).toFixed(2),
  cacheReadShare:+(r.cacheReadTok/(r.totalTok||1)).toFixed(2), model:r.primaryModel,
  prompt:(r.firstPrompt||"").slice(0,80)
})),null,0));

// ---------- console report ----------
const d = (x) => x==null?"—":"$"+x.toFixed(2);
const n0 = (x) => x==null?"—":Math.round(x);
console.log(`\n=== CORPUS (${clean.length} real agent conversations of ${rows.length} total) ===`);
const c = report.corpus;
console.log(`cost:        median ${d(c.cost.median)}  p25 ${d(c.cost.p25)}  p75 ${d(c.cost.p75)}  p90 ${d(c.cost.p90)}  mean ${d(c.cost.mean)}`);
console.log(`lognormal:   mu=${c.costLognormal.mu.toFixed(3)} sigma=${c.costLognormal.sigma.toFixed(3)}  (median $${c.costLognormal.medianDollars.toFixed(2)})`);
console.log(`asst msgs:   median ${n0(c.assistantMsgs.median)}  p90 ${n0(c.assistantMsgs.p90)}`);
console.log(`tool calls:  median ${n0(c.toolCalls.median)}  p90 ${n0(c.toolCalls.p90)}`);
console.log(`duration:    median ${n0(c.durationMin.median)}m  p90 ${n0(c.durationMin.p90)}m`);
console.log(`cache-read share of tokens: median ${(c.cacheReadShare.median*100).toFixed(0)}%`);

console.log(`\n=== COST DRIVERS (power fit cost = a * X^b) ===`);
const pf=(x)=>`a=${x.a.toFixed(4)}  b=${x.b.toFixed(3)}  R²=${x.r2.toFixed(3)}`;
console.log(`vs assistant msgs: ${pf(report.drivers.costVsAssistantMsgs)}`);
console.log(`vs tool calls:     ${pf(report.drivers.costVsToolCalls)}`);
console.log(`vs duration(min):  ${pf(report.drivers.costVsDurationMin)}`);

console.log(`\n=== BY TYPOLOGY (median cost / median msgs / n) ===`);
for (const [k, v] of Object.entries(report.byTypology).sort((a,b)=>b[1].cost.median-a[1].cost.median))
  console.log(`  ${k.padEnd(9)} ${d(v.cost.median).padStart(7)}  msgs ${n0(v.assistantMsgs.median).toString().padStart(3)}  ($/msg ${d(v.costPerAssistantMsg.median)})  n=${v.n}`);

console.log(`\n=== BY COMPLEXITY ===`);
for (const k of ["simple","moderate","complex"]) { const v=report.byComplexity[k]; if(v)
  console.log(`  ${k.padEnd(9)} median ${d(v.cost.median)}  p25 ${d(v.cost.p25)}  p75 ${d(v.cost.p75)}  msgs ${n0(v.assistantMsgs.median)}  n=${v.n}`); }

console.log(`\n=== BY PROJECT (top by n) ===`);
Object.entries(report.byProject).sort((a,b)=>b[1].n-a[1].n).slice(0,15).forEach(([k,v])=>
  console.log(`  ${k.padEnd(20)} median ${d(v.cost.median)}  msgs ${n0(v.assistantMsgs.median).toString().padStart(3)}  n=${v.n}`));

console.log(`\n=== PER-TURN UNIT ECONOMICS ===`);
const p=report.perTurn;
console.log(`cost / assistant msg:      median ${d(p.costPerAssistantMsg.median)}  p25 ${d(p.costPerAssistantMsg.p25)}  p75 ${d(p.costPerAssistantMsg.p75)}`);
console.log(`total tok / assistant msg: median ${n0(p.totalTokPerAssistantMsg.median)}  (cache-read ${n0(p.cacheReadTokPerAssistantMsg.median)}, output ${n0(p.outputTokPerAssistantMsg.median)})`);
console.log(`tool calls / assistant msg: median ${p.toolCallsPerAssistantMsg.median.toFixed(2)}`);
console.log(`\nWrote /tmp/appe-agentic-model.json and /tmp/appe-agentic-clean.json`);
