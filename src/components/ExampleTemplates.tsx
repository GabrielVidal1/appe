
import { Badge } from "@/components/ui/badge";

interface ExampleTemplate {
  name: string;
  type: "text" | "image";
  prompt: string;
  output: string;
}

const examples: ExampleTemplate[] = [
  {
    name: "Translation",
    type: "text",
    prompt: "Translate the following sentence to French",
    output: '{ "translation": "Bonjour le monde" }'
  },
  {
    name: "Summarization", 
    type: "text",
    prompt: "Summarize the following article in one sentence",
    output: '{ "summary": "The article discusses the impact of climate change on global weather patterns." }'
  },
  {
    name: "Image Description",
    type: "image", 
    prompt: "Describe the content of this image",
    output: "The image shows a beautiful sunset over a mountain range with a clear sky."
  }
];

interface ExampleTemplatesProps {
  dataType: string;
  onSelectExample: (prompt: string, output: string) => void;
}

const ExampleTemplates = ({ dataType, onSelectExample }: ExampleTemplatesProps) => {
  const filteredExamples = examples.filter(example => {
    if (dataType === "prompts") return example.type === "text";
    if (dataType === "images") return example.type === "image";
    return false;
  });

  if (filteredExamples.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Quick examples:</div>
      <div className="flex flex-wrap gap-2">
        {filteredExamples.map((example) => (
          <Badge
            key={example.name}
            variant="outline"
            className="cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onSelectExample(example.prompt, example.output)}
          >
            {example.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ExampleTemplates;
