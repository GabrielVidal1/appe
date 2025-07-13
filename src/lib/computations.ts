import { AppData } from "@/types/appData";
import { Model } from "@/types/model";
import { PROVIDERS } from "@/types/provider";
import { PricingResult, TokenResults } from "@/types/results";
import { computeImagePrice } from "./imageCost";

const strToTokens = (str: string): number => {
  // Rough estimation: ~4 chars per token
  return Math.ceil(str.length / 4);
};

/**
 * Computes the token usage for a given appData and model.
 * For a single process
 * @param appData
 * @param model
 * @returns
 */
export const computeTokens = (
  appData: AppData,
  model?: Model
): TokenResults => {
  const inputTextTokens = strToTokens(appData.prompt);
  let inputDocumentTokens = 0;
  let inputImageTokens = 0;

  const { pdf } = PROVIDERS[model?.provider ?? "openai"];

  if (appData.dataType === "images" && appData.imageSize) {
    inputImageTokens = +computeImagePrice(
      model?.provider ?? "openai",
      appData.imageSize.width,
      appData.imageSize.height
    ).tokens.toFixed(0);
  } else if (appData.dataType === "pdfs" && appData.pdfData) {
    inputDocumentTokens +=
      appData.pdfData.pages *
      (pdf?.tokenPerPage ?? appData.pdfData.tokenPerPage);
  }
  const outputTokens = strToTokens(appData.example);

  return {
    model,
    inputTokens: {
      text: inputTextTokens,
      document: inputDocumentTokens,
      image: inputImageTokens,
      total: inputTextTokens + inputDocumentTokens + inputImageTokens,
    },
    outputTokens: outputTokens,
    totalTokens:
      inputTextTokens + inputDocumentTokens + inputImageTokens + outputTokens,
  };
};

/**
 * Computes the token usage for a given appData and model.
 * For all sample
 */
export const computePrices = (
  appData: AppData,
  model: Model,
  tokenResults: TokenResults
): PricingResult => {
  const provider = PROVIDERS[model.provider];
  const { input_cost, output_cost, cache_cost } = model;

  const outputCost =
    tokenResults.outputTokens * (output_cost / 1000000) * appData.dataCount;
  let inputCost =
    tokenResults.inputTokens.text * (input_cost / 1000000) * appData.dataCount;
  let cachedCost = 0;
  let inputDocumentCost = 0;
  let inputImageCost = 0;

  if (cache_cost !== null) {
    cachedCost =
      (appData.dataCount - 1) *
      tokenResults.inputTokens.text *
      (cache_cost / 1000000);
    inputCost = tokenResults.inputTokens.text * (input_cost / 1000000);
  }

  if (
    appData.dataType === "pdfs" &&
    provider.pdf?.pricePerKPage &&
    appData.pdfData
  ) {
    inputDocumentCost +=
      appData.pdfData.pages * provider.pdf.pricePerKPage * appData.dataCount;
  }

  if (appData.dataType === "images") {
    inputImageCost +=
      computeImagePrice(
        model.provider,
        appData.imageSize.width,
        appData.imageSize.height
      ).cost * appData.dataCount;
  }

  return {
    ...tokenResults,
    inputCost: {
      text: inputCost,
      document: inputDocumentCost,
      image: inputImageCost,
      total: inputCost + inputDocumentCost + inputImageCost + cachedCost,
    },
    outputCost,
    totalCost: inputCost + outputCost + inputDocumentCost + inputImageCost,
  };
};
