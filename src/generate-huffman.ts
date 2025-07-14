import fs from "fs";
import { URLSearchParams } from "url";
import { DEFAULT_APP_DATA } from "./types/appData";

type HuffmanNode = {
  char?: string;
  freq: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
};

function buildFrequencyMap(str: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

function buildHuffmanTree(freqMap: Record<string, number>): HuffmanNode {
  const nodes: HuffmanNode[] = Object.entries(freqMap).map(([char, freq]) => ({
    char,
    freq,
  }));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift()!;
    const right = nodes.shift()!;
    nodes.push({ freq: left.freq + right.freq, left, right });
  }

  return nodes[0];
}

function generateCodes(
  node: HuffmanNode,
  prefix = "",
  codeMap: Record<string, string> = {}
): Record<string, string> {
  if (node.char !== undefined) {
    codeMap[node.char] = prefix;
  } else {
    if (node.left) generateCodes(node.left, prefix + "0", codeMap);
    if (node.right) generateCodes(node.right, prefix + "1", codeMap);
  }
  return codeMap;
}

function flattenObject(obj: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key in obj) {
    out[key] = String(obj[key]);
  }
  return out;
}

// ==== MAIN ====
const flat = flattenObject(DEFAULT_APP_DATA);
const params = new URLSearchParams(flat);
const urlEncoded = params.toString(); // this is the source string for Huffman

const freqMap = buildFrequencyMap(urlEncoded);
const huffmanTree = buildHuffmanTree(freqMap);
const codeMap = generateCodes(huffmanTree);

// Save to JSON
fs.writeFileSync("huffman-map.json", JSON.stringify(codeMap, null, 2), "utf-8");

console.log("✅ Huffman map written to huffman-map.json");
