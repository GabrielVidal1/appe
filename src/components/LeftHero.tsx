import { ALL_PROVIDERS, MODELS_META } from "@appe/core";
import { Brain, Calculator, ExternalLink, TrendingUp } from "lucide-react";
import { memo } from "react";
import { ProviderIcon } from "./ProviderIcons";

// A curated, recognisable subset shown as a logo strip — filtered to those
// actually present in the synced catalogue so it never shows an empty icon.
const FEATURED_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "xai",
  "deepseek",
  "llama",
  "moonshotai",
  "groq",
  "cohere",
  "togetherai",
  "amazon-bedrock",
].filter((p) => ALL_PROVIDERS.includes(p));

const LeftSideContent = () => (
  <div className="flex flex-col justify-center h-full p-8">
    <div className="max-w-lg">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        AI Processing Price Estimator
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Compare pricing across{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {MODELS_META.modelCount.toLocaleString()} models
        </span>{" "}
        from{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {MODELS_META.providerCount} providers
        </span>{" "}
        and find the most cost-effective solution for your data processing needs.
      </p>

      {/* Available models showcase */}
      <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-4">
        <div className="flex items-center flex-wrap gap-3 mb-3">
          {FEATURED_PROVIDERS.map((provider) => (
            <ProviderIcon
              key={provider}
              provider={provider}
              className="h-7 w-7"
            />
          ))}
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            +{Math.max(0, MODELS_META.providerCount - FEATURED_PROVIDERS.length)}{" "}
            more
          </span>
        </div>
        <a
          href="https://models.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Pricing data from the models.dev database
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Brain className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
          <div>
            <h3 className="font-semibold mb-1 dark:text-gray-100">
              Every model, one place
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Text, image, PDF and audio models across every major provider,
              synced daily from models.dev
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Calculator
            className="text-green-600 dark:text-green-400 mt-1"
            size={24}
          />
          <div>
            <h3 className="font-semibold mb-1 dark:text-gray-100">
              Accurate Estimates
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Get precise cost calculations based on your specific requirements
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <TrendingUp
            className="text-purple-600 dark:text-purple-400 mt-1"
            size={24}
          />
          <div>
            <h3 className="font-semibold mb-1 dark:text-gray-100">
              Best Value
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Find the most cost-effective solution for your budget and needs
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default memo(LeftSideContent);
