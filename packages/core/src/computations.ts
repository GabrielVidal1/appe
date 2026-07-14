import { AppData } from "./types/appData";
import { Model } from "./types/model";
import { getProviderParams } from "./types/provider";
import { PricingResult, TokenResults } from "./types/results";
import { computeImagePrice } from "./imageCost";
import { strToTokens, strToTokensSync } from "./tokenization";

/**
 * Computes the token usage for a given appData and model.
 * For a single process (synchronous version)
 * @param appData
 * @param model
 * @returns
 */
export const computeTokens = (
  appData: AppData,
  model?: Model
): TokenResults => {
  const inputTextTokens = strToTokensSync(appData.prompt);
  let inputDocumentTokens = 0;
  let inputImageTokens = 0;
  let inputAudioTokens = 0;

  const { pdf } = getProviderParams(model?.provider);

  if (appData.dataType === "images" && appData.imageSize) {
    inputImageTokens = +computeImagePrice(
      model?.provider ?? "openai",
      appData.imageSize.width,
      appData.imageSize.height
    ).tokens.toFixed(0);
  } else if (appData.dataType === "pdfs" && appData.pdfData) {
    const tokenPerPage = pdf?.tokenPerPage ?? appData.pdfData.tokenPerPage;

    inputDocumentTokens += appData.pdfData.pages * tokenPerPage;
  } else if (appData.dataType === "audio" && appData.audioData) {
    inputAudioTokens =
      appData.audioData.seconds * appData.audioData.tokensPerSecond;
  }
  const outputTokens = strToTokensSync(appData.example);

  const inputTotal =
    inputTextTokens + inputDocumentTokens + inputImageTokens + inputAudioTokens;

  return {
    model,
    inputTokens: {
      text: inputTextTokens,
      document: inputDocumentTokens,
      image: inputImageTokens,
      audio: inputAudioTokens,
      total: inputTotal,
    },
    outputTokens: outputTokens,
    totalTokens: inputTotal + outputTokens,
  };
};

/**
 * Computes the token usage for a given appData and model.
 * For a single process (async version with accurate tokenization)
 * @param appData
 * @param model
 * @returns
 */
export const computeTokensAsync = async (
  appData: AppData,
  model?: Model
): Promise<TokenResults> => {
  const inputTextTokens = await strToTokens(appData.prompt, model?.provider);
  let inputDocumentTokens = 0;
  let inputImageTokens = 0;
  let inputAudioTokens = 0;

  const { pdf } = getProviderParams(model?.provider);

  if (appData.dataType === "images" && appData.imageSize) {
    inputImageTokens = +computeImagePrice(
      model?.provider ?? "openai",
      appData.imageSize.width,
      appData.imageSize.height
    ).tokens.toFixed(0);
  } else if (appData.dataType === "pdfs" && appData.pdfData) {
    const tokenPerPage = pdf?.tokenPerPage ?? appData.pdfData.tokenPerPage;

    inputDocumentTokens += appData.pdfData.pages * tokenPerPage;
  } else if (appData.dataType === "audio" && appData.audioData) {
    inputAudioTokens =
      appData.audioData.seconds * appData.audioData.tokensPerSecond;
  }
  const outputTokens = await strToTokens(appData.example, model?.provider);

  const inputTotal =
    inputTextTokens + inputDocumentTokens + inputImageTokens + inputAudioTokens;

  return {
    model,
    inputTokens: {
      text: inputTextTokens,
      document: inputDocumentTokens,
      image: inputImageTokens,
      audio: inputAudioTokens,
      total: inputTotal,
    },
    outputTokens: outputTokens,
    totalTokens: inputTotal + outputTokens,
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
  const provider = getProviderParams(model.provider);
  const { input_cost, output_cost, cache_cost } = model;
  const batchDiscount = appData.batchEnabled ? provider.batchDiscount || 1 : 1;

  const outputCost =
    tokenResults.outputTokens *
    (output_cost / 1000000) *
    appData.dataCount *
    batchDiscount;
  const inputCost =
    tokenResults.inputTokens.text *
    (input_cost / 1000000) *
    appData.dataCount *
    batchDiscount;
  let cachedCost = 0;
  let inputDocumentCost = 0;
  let inputImageCost = 0;
  let inputAudioCost = 0;

  if (cache_cost !== null) {
    cachedCost =
      (appData.dataCount - 1) *
      tokenResults.inputTokens.text *
      (cache_cost / 1000000) *
      batchDiscount;
    // inputCost =
    //   tokenResults.inputTokens.text * (input_cost / 1000000) * batchDiscount;
  }

  if (appData.dataType === "pdfs" && appData.pdfData) {
    if (provider.pdf?.pricePerKPage) {
      inputDocumentCost +=
        appData.pdfData.pages *
        (provider.pdf.pricePerKPage / 1000) *
        appData.dataCount *
        batchDiscount;
    } else {
      inputDocumentCost +=
        tokenResults.inputTokens.document *
        (input_cost / 1000000) *
        appData.dataCount *
        batchDiscount;
    }
  }

  if (appData.dataType === "images") {
    const { tokens, cost } = computeImagePrice(
      model.provider,
      appData.imageSize.width,
      appData.imageSize.height
    );

    inputImageCost += cost
      ? cost * appData.dataCount * batchDiscount
      : (model.input_cost / 1000000) *
        tokens *
        appData.dataCount *
        batchDiscount;
  }

  if (appData.dataType === "audio") {
    // Use the dedicated audio-input rate when models.dev provides one,
    // otherwise fall back to the regular input-token rate.
    const audioRate = model.input_audio_cost ?? model.input_cost;
    inputAudioCost +=
      tokenResults.inputTokens.audio *
      (audioRate / 1000000) *
      appData.dataCount *
      batchDiscount;
  }

  return {
    ...tokenResults,
    inputCost: {
      text: inputCost,
      document: inputDocumentCost,
      image: inputImageCost,
      audio: inputAudioCost,
      total:
        inputCost +
        inputDocumentCost +
        inputImageCost +
        inputAudioCost +
        cachedCost,
    },
    outputCost,
    totalCost:
      inputCost +
      outputCost +
      inputDocumentCost +
      inputImageCost +
      inputAudioCost,
  };
};
