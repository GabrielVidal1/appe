import { Provider } from "./model";

import providerData from "@/data/provider_data.json";

export type ProviderParams = Record<
  Provider,
  {
    name: string; // Display name of the provider
    batchDiscount: number; // Discount for batch processing in percentage (0-100)
    pdf?: {
      tokenPerPage?: number; // Number of tokens per page for PDF processing
      pricePerKPage?: number; // Price per 1000 page for PDF processing
    };
  }
>;

export const PROVIDERS: ProviderParams = providerData;
