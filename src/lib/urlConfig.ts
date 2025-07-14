import { ALL_TEXT_MODELS } from "@/data";
import { AppData } from "@/types/appData";
import { entries } from "lodash";
import { LOREM_IPSUM } from "./constants";

// Single letter identifiers for main parameters
const PARAM_MAP: Record<keyof AppData, string> = {
  dataCount: "c",
  dataType: "t",
  prompt: "p",
  example: "e",
  imageSize: "i",
  pdfData: "d",
  modelSize: "s",
  modelCapabilities: "m",
  selectedTiers: "r",
  selectedProviders: "v",
  showColumns: "w",
  configName: "n",
  batchEnabled: "b",
  selectedModels: "x",
} as const;

// Reverse mapping for decoding
const REVERSE_PARAM_MAP = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([key, value]) => [value, key])
) as Record<string, keyof AppData>;

// String value mappings to reduce length
const VALUE_MAPPINGS = {
  dataType: {
    prompts: "0",
    images: "1",
    pdfs: "2",
  },
  modelSize: {
    small: "0",
    medium: "1",
    big: "2",
  },
  tierOptions: {
    small: "0",
    medium: "1",
    big: "2",
  },
  providerOptions: {
    claude: "0",
    mistral: "1",
    openai: "2",
  },
  models: ALL_TEXT_MODELS.reduce((acc, model, i) => {
    acc[model.id] = i.toString(); // Assuming each model has a unique id
    return acc;
  }, {} as Record<string, string>),
} as const;

// Reverse mappings for decoding
const REVERSE_VALUE_MAPPINGS = {
  dataType: Object.fromEntries(
    Object.entries(VALUE_MAPPINGS.dataType).map(([key, value]) => [value, key])
  ),
  modelSize: Object.fromEntries(
    Object.entries(VALUE_MAPPINGS.modelSize).map(([key, value]) => [value, key])
  ),
  tierOptions: Object.fromEntries(
    Object.entries(VALUE_MAPPINGS.tierOptions).map(([key, value]) => [
      value,
      key,
    ])
  ),
  providerOptions: Object.fromEntries(
    Object.entries(VALUE_MAPPINGS.providerOptions).map(([key, value]) => [
      value,
      key,
    ])
  ),
  modelOptions: Object.fromEntries(
    Object.entries(VALUE_MAPPINGS.models).map(([key, value]) => [value, key])
  ),
} as const;

// Simple encryption/decryption using base64 and basic XOR
const ENCRYPTION_KEY = "promptPricePredictor2025";

function simpleEncrypt(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode =
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

function simpleDecrypt(encryptedText: string): string {
  try {
    const decoded = atob(encryptedText);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode =
        decoded.charCodeAt(i) ^
        ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    throw new Error("Invalid encrypted data");
  }
}

// Compress form data into a compact format
function compressFormData(data: AppData): Record<string, unknown> {
  const compressed: Record<string, unknown> = {};

  // Map each field to its single letter identifier and compress values
  entries(data).forEach(([rawKey, value]) => {
    const key = rawKey as keyof AppData;
    const mappedKey = PARAM_MAP[key as keyof AppData];
    if (!mappedKey) return;

    switch (key) {
      case "dataType":
        compressed[mappedKey] =
          VALUE_MAPPINGS.dataType[
            value as keyof typeof VALUE_MAPPINGS.dataType
          ];
        break;
      case "modelSize":
        compressed[mappedKey] =
          VALUE_MAPPINGS.modelSize[
            value as keyof typeof VALUE_MAPPINGS.modelSize
          ];
        break;
      case "selectedTiers":
        if (Array.isArray(value)) {
          compressed[mappedKey] = value
            .map(
              (tier) =>
                VALUE_MAPPINGS.tierOptions[
                  tier as keyof typeof VALUE_MAPPINGS.tierOptions
                ]
            )
            .join("");
        }
        break;
      case "selectedProviders":
        if (Array.isArray(value)) {
          compressed[mappedKey] = value
            .map(
              (provider) =>
                VALUE_MAPPINGS.providerOptions[
                  provider as keyof typeof VALUE_MAPPINGS.providerOptions
                ]
            )
            .join("");
        }
        break;
      case "imageSize":
        if (
          value &&
          typeof value === "object" &&
          "width" in value &&
          "height" in value
        ) {
          compressed[mappedKey] = `${value.width}x${value.height}`;
        }
        break;
      case "pdfData":
        if (
          value &&
          typeof value === "object" &&
          "pages" in value &&
          "tokenPerPage" in value
        ) {
          compressed[mappedKey] = `${value.pages}-${value.tokenPerPage}`;
        }
        break;
      case "showColumns":
        if (value && typeof value === "object") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bvalue = value as any;
          const flags = [
            bvalue.size ? "1" : "0",
            bvalue.inputOutput ? "1" : "0",
            bvalue.tags ? "1" : "0",
          ].join("");
          compressed[mappedKey] = flags;
        }
        break;
      case "modelCapabilities":
        if (Array.isArray(value)) {
          compressed[mappedKey] = value.join(",");
        }
        break;
      case "configName":
        // Store config name as-is if provided
        if (typeof value === "string" && value.trim()) {
          compressed[mappedKey] = value.trim();
        }
        break;
      case "prompt":
      case "example":
        if (typeof value === "string") {
          compressed[mappedKey] = value.length;
        }
        break;
      case "dataCount":
        if (typeof value === "number") {
          compressed[mappedKey] = value.toString();
        }
        break;
      case "selectedModels":
        if (Array.isArray(value)) {
          compressed[mappedKey] = value
            .map((model) => VALUE_MAPPINGS.models[model])
            .join(",");
        }
        break;
      case "batchEnabled":
        // Store batchEnabled as a boolean string
        compressed[mappedKey] = value ? "1" : "0";
        break;
    }
  });

  return compressed;
}

// Decompress form data from compact format
function decompressFormData(
  compressed: Record<string, unknown>
): Partial<AppData> {
  const decompressed: Partial<AppData> = {};

  Object.entries(compressed).forEach(([key, value]) => {
    const originalKey = REVERSE_PARAM_MAP[key];
    if (!originalKey) return;

    switch (originalKey) {
      case "dataType":
        decompressed[originalKey] = REVERSE_VALUE_MAPPINGS.dataType[
          value as keyof typeof REVERSE_VALUE_MAPPINGS.dataType
        ] as AppData["dataType"];
        break;
      case "modelSize":
        decompressed[originalKey] = REVERSE_VALUE_MAPPINGS.modelSize[
          value as keyof typeof REVERSE_VALUE_MAPPINGS.modelSize
        ] as AppData["modelSize"];
        break;
      case "selectedTiers":
        if (typeof value === "string") {
          decompressed[originalKey] = value
            .split("")
            .map(
              (tier) =>
                REVERSE_VALUE_MAPPINGS.tierOptions[
                  tier as keyof typeof REVERSE_VALUE_MAPPINGS.tierOptions
                ]
            )
            .filter(Boolean) as AppData["selectedTiers"];
        }
        break;
      case "selectedProviders":
        if (typeof value === "string") {
          decompressed[originalKey] = value
            .split("")
            .map(
              (provider) =>
                REVERSE_VALUE_MAPPINGS.providerOptions[
                  provider as keyof typeof REVERSE_VALUE_MAPPINGS.providerOptions
                ]
            )
            .filter(Boolean) as AppData["selectedProviders"];
        }
        break;
      case "imageSize":
        if (typeof value === "string" && value.includes("x")) {
          const [width, height] = value.split("x").map(Number);
          if (!isNaN(width) && !isNaN(height)) {
            decompressed[originalKey] = { width, height };
          }
        }
        break;
      case "pdfData":
        if (typeof value === "string" && value.includes("-")) {
          const [pages, tokenPerPage] = value.split("-").map(Number);
          if (!isNaN(pages) && !isNaN(tokenPerPage)) {
            decompressed[originalKey] = { pages, tokenPerPage };
          }
        }
        break;
      case "showColumns":
        if (typeof value === "string" && value.length === 3) {
          decompressed[originalKey] = {
            size: value[0] === "1",
            inputOutput: value[1] === "1",
            tags: value[2] === "1",
          };
        }
        break;
      case "modelCapabilities":
        if (typeof value === "string") {
          decompressed[originalKey] = value ? value.split(",") : [];
        }
        break;
      case "configName":
        if (typeof value === "string") {
          decompressed[originalKey] = value;
        }
        break;
      case "dataCount":
        if (typeof value === "string") {
          decompressed[originalKey] = parseInt(value, 10);
        } else if (typeof value === "number") {
          decompressed[originalKey] = value;
        }
        break;
      case "prompt":
      case "example":
        decompressed[originalKey] = LOREM_IPSUM.substring(0, +value);
        break;
      case "selectedModels":
        if (typeof value === "string") {
          decompressed[originalKey] = value
            .split("")
            .map(
              (model) =>
                REVERSE_VALUE_MAPPINGS.modelOptions[
                  model as keyof typeof REVERSE_VALUE_MAPPINGS.modelOptions
                ]
            )
            .filter(Boolean) as AppData["selectedModels"];
        }
    }
  });

  return decompressed;
}

// Export functions for URL sharing
export function createShareableUrl(
  formData: AppData,
  configName?: string,
  baseUrl?: string
): string {
  // Create a copy of formData with the optional configName
  const dataWithName = configName?.trim()
    ? { ...formData, configName: configName.trim() }
    : formData;
  console.log("sharing config:", dataWithName);
  const compressed = compressFormData(dataWithName);
  console.log("Compressed form data:", compressed);
  const jsonString = new URLSearchParams(
    Object.entries(compressed).map(([key, value]) => [key, `${value}`])
  ).toString();
  const encrypted = simpleEncrypt(jsonString);
  const configString = encodeURIComponent(encrypted);

  const url = baseUrl || window.location.origin + window.location.pathname;
  return `${url}?config=${configString}`;
}

export function parseConfigFromUrl(url?: string): Partial<AppData> | null {
  try {
    const urlObj = new URL(url || window.location.href);
    const configParam = urlObj.searchParams.get("config");

    if (!configParam) {
      return null;
    }

    const decoded = decodeURIComponent(configParam);
    const decrypted = simpleDecrypt(decoded);
    const asParams = new URLSearchParams(decrypted);
    const compressed: Record<string, unknown> = {};
    asParams.forEach((value, key) => {
      compressed[key] = value;
    });
    console.log("Decrypted and parsed config from URL:", compressed);
    const config = decompressFormData(compressed);
    console.log("Parsed config from URL:", config);
    return config;
  } catch (error) {
    console.error("Failed to parse config from URL:", error);
    clearConfigFromUrl();
    return null;
  }
}

export function updateUrlWithConfig(formData: AppData): void {
  const shareableUrl = createShareableUrl(formData);
  const url = new URL(shareableUrl);
  // Update the current URL without reloading the page
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function clearConfigFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("config");
  window.history.replaceState({}, "", url.pathname + url.search);
}
