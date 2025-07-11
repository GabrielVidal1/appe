
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Calculator, TrendingUp } from "lucide-react";

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI Data Processing Cost Estimator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Compare pricing across major AI providers and find the most cost-effective solution for your data processing needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Brain className="mx-auto mb-4 text-blue-600" size={48} />
              <h3 className="text-lg font-semibold mb-2">Multiple AI Models</h3>
              <p className="text-gray-600">Compare small, medium, and large models across different providers</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Calculator className="mx-auto mb-4 text-green-600" size={48} />
              <h3 className="text-lg font-semibold mb-2">Accurate Estimates</h3>
              <p className="text-gray-600">Get precise cost calculations based on your specific requirements</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <TrendingUp className="mx-auto mb-4 text-purple-600" size={48} />
              <h3 className="text-lg font-semibold mb-2">Best Value</h3>
              <p className="text-gray-600">Find the most cost-effective solution for your budget and needs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;
