import { Brain, Calculator, TrendingUp } from "lucide-react";

const LeftSideContent = () => (
  <div className="flex flex-col justify-center h-full p-8">
    <div className="max-w-lg">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        AI Processing Price Estimator
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Compare pricing across major AI providers and find the most
        cost-effective solution for your data processing needs.
      </p>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Brain className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
          <div>
            <h3 className="font-semibold mb-1 dark:text-gray-100">
              Multiple AI Models
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Compare small, medium, and large models across different providers
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

export default LeftSideContent;
