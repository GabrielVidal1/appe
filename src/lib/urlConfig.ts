import { FormDataContext } from "@/contexts/form/type";
import { LOREM_IPSUM } from "./constants";

// Single letter identifiers for main parameters
const PARAM_MAP = {
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
} as const;

// Reverse mapping for decoding
const REVERSE_PARAM_MAP = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([key, value]) => [value, key])
) as Record<string, keyof FormDataContext>;

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
function compressFormData(data: FormDataContext): Record<string, unknown> {
  const compressed: Record<string, unknown> = {};

  // Map each field to its single letter identifier and compress values
  Object.entries(data).forEach(([key, value]) => {
    const mappedKey = PARAM_MAP[key as keyof FormDataContext];
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
          const flags = [
            value.size ? "1" : "0",
            value.inputOutput ? "1" : "0",
            value.tags ? "1" : "0",
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
      default:
        compressed[mappedKey] = value;
    }
  });

  return compressed;
}

// Decompress form data from compact format
function decompressFormData(
  compressed: Record<string, unknown>
): Partial<FormDataContext> {
  const decompressed: Partial<FormDataContext> = {};

  Object.entries(compressed).forEach(([key, value]) => {
    const originalKey = REVERSE_PARAM_MAP[key];
    if (!originalKey) return;

    switch (originalKey) {
      case "dataType":
        decompressed[originalKey] = REVERSE_VALUE_MAPPINGS.dataType[
          value as keyof typeof REVERSE_VALUE_MAPPINGS.dataType
        ] as FormDataContext["dataType"];
        break;
      case "modelSize":
        decompressed[originalKey] = REVERSE_VALUE_MAPPINGS.modelSize[
          value as keyof typeof REVERSE_VALUE_MAPPINGS.modelSize
        ] as FormDataContext["modelSize"];
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
            .filter(Boolean) as FormDataContext["selectedTiers"];
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
            .filter(Boolean) as FormDataContext["selectedProviders"];
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
        if (typeof value === "number") {
          decompressed[originalKey] = LOREM_IPSUM.substring(0, value);
        }
        break;
    }
  });

  return decompressed;
}

// Export functions for URL sharing
export function createShareableUrl(
  formData: FormDataContext,
  configName?: string,
  baseUrl?: string
): string {
  // Create a copy of formData with the optional configName
  const dataWithName = configName?.trim()
    ? { ...formData, configName: configName.trim() }
    : formData;

  const compressed = compressFormData(dataWithName);
  const jsonString = JSON.stringify(compressed);
  const encrypted = simpleEncrypt(jsonString);
  const configString = encodeURIComponent(encrypted);

  const url = baseUrl || window.location.origin + window.location.pathname;
  return `${url}?config=${configString}`;
}

export function parseConfigFromUrl(
  url?: string
): Partial<FormDataContext> | null {
  try {
    const urlObj = new URL(url || window.location.href);
    const configParam = urlObj.searchParams.get("config");

    if (!configParam) {
      return null;
    }

    const decoded = decodeURIComponent(configParam);
    const decrypted = simpleDecrypt(decoded);
    const compressed = JSON.parse(decrypted);

    return decompressFormData(compressed);
  } catch (error) {
    console.error("Failed to parse config from URL:", error);
    return null;
  }
}

export function updateUrlWithConfig(formData: FormDataContext): void {
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
