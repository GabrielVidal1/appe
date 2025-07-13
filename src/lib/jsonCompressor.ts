type HuffmanCodeMap = { [char: string]: string };
type HuffmanDecodeMap = { [code: string]: string };
type KeyValueMap = { [key: string]: string };

export class JsonUrlCompressor<T extends object> {
  private keyValueMap: KeyValueMap;
  private reverseKeyValueMap: KeyValueMap;
  private huffmanMap: HuffmanCodeMap;
  private huffmanDecodeMap: HuffmanDecodeMap;

  constructor(keyValueMap: KeyValueMap, huffmanMap: HuffmanCodeMap) {
    this.keyValueMap = keyValueMap;
    this.reverseKeyValueMap = this.invertMap(keyValueMap);
    this.huffmanMap = huffmanMap;
    this.huffmanDecodeMap = this.buildDecodeMap(huffmanMap);
  }

  private invertMap(map: KeyValueMap): KeyValueMap {
    const inverted: KeyValueMap = {};
    for (const key in map) {
      inverted[map[key]] = key;
    }
    return inverted;
  }

  private buildDecodeMap(huffmanMap: HuffmanCodeMap): HuffmanDecodeMap {
    const decodeMap: HuffmanDecodeMap = {};
    for (const char in huffmanMap) {
      decodeMap[huffmanMap[char]] = char;
    }
    return decodeMap;
  }

  private minifyJson(json: T): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in json) {
      const minKey = this.keyValueMap[key] ?? key;
      let value = (json as any)[key];
      if (typeof value === "boolean") value = value.toString();
      const minVal = this.keyValueMap[value] ?? String(value);
      result[minKey] = minVal;
    }
    return result;
  }

  private restoreJson(minified: Record<string, string>): T {
    const result: any = {};
    for (const key in minified) {
      const fullKey = this.reverseKeyValueMap[key] ?? key;
      const fullVal = this.reverseKeyValueMap[minified[key]] ?? minified[key];
      result[fullKey] = this.parseValue(fullVal);
    }
    return result as T;
  }

  private parseValue(val: string): any {
    if (val === "true" || val === "false") return val === "true";
    const num = Number(val);
    return isNaN(num) ? val : num;
  }

  private toUrlParams(obj: Record<string, string>): string {
    const params = new URLSearchParams(obj);
    return params.toString();
  }

  private fromUrlParams(paramStr: string): Record<string, string> {
    const params = new URLSearchParams(paramStr);
    const result: Record<string, string> = {};
    for (const [key, val] of params.entries()) {
      result[key] = val;
    }
    return result;
  }

  private huffmanEncode(input: string): string {
    return input
      .split("")
      .map((char) => this.huffmanMap[char])
      .join("");
  }

  private huffmanDecode(binary: string): string {
    let current = "";
    let result = "";
    for (const bit of binary) {
      current += bit;
      if (this.huffmanDecodeMap[current]) {
        result += this.huffmanDecodeMap[current];
        current = "";
      }
    }
    return result;
  }

  private toBase64UrlSafe(binary: string): string {
    const byteArray =
      binary.match(/.{1,8}/g)?.map((b) => parseInt(b.padEnd(8, "0"), 2)) || [];
    const uint8 = new Uint8Array(byteArray);
    const base64 = btoa(String.fromCharCode(...uint8));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  private fromBase64UrlSafe(encoded: string): string {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binaryString = atob(base64);
    const binary = Array.from(binaryString)
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
      .join("");
    return binary;
  }

  public compress(json: T): string {
    const minified = this.minifyJson(json);
    const urlParam = this.toUrlParams(minified);
    const huffmanEncoded = this.huffmanEncode(urlParam);
    return this.toBase64UrlSafe(huffmanEncoded);
  }

  public decompress(encoded: string): T {
    const binary = this.fromBase64UrlSafe(encoded);
    const decodedUrl = this.huffmanDecode(binary);
    const minified = this.fromUrlParams(decodedUrl);
    return this.restoreJson(minified);
  }
}
