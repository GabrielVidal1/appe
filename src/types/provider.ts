import { Provider } from "./model";

import providerData from "@/data/provider_data.json";

export type ProviderConfig = {
  name: string; // Display name of the provider
  batchDiscount: number; // Multiplier applied to cost when batch processing (e.g. 0.5)
  pdf?: {
    tokenPerPage?: number; // Number of tokens per page for PDF processing
    pricePerKPage?: number; // Price per 1000 page for PDF processing
  };
};

export type ProviderParams = Record<Provider, ProviderConfig>;

export const PROVIDERS: ProviderParams = providerData;

// Fallback for providers not present in provider_data.json (or when no model is
// selected). No batch discount and no page-based pdf pricing — the estimator
// then defaults to token-based pdf/image cost, which is the "use a default when
// not known" behaviour.
export const DEFAULT_PROVIDER: ProviderConfig = {
  name: "Provider",
  batchDiscount: 1,
};

/** Safe accessor: never throws on an unknown / undefined provider id. */
export const getProviderParams = (provider?: Provider): ProviderConfig =>
  (provider && PROVIDERS[provider]) || DEFAULT_PROVIDER;
