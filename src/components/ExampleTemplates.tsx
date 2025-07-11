import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    output: '{ "translation": "Bonjour le monde" }',
  },
  {
    name: "Summarization",
    type: "text",
    prompt: "Summarize the following article in one sentence",
    output:
      '{ "summary": "The article discusses the impact of climate change on global weather patterns." }',
  },
  {
    name: "Image Description",
    type: "image",
    prompt: "Describe the content of this image",
    output:
      "The image shows a beautiful sunset over a mountain range with a clear sky.",
  },
];

interface ExampleTemplatesProps {
  dataType: string;
  onSelectExample: (prompt: string, output: string) => void;
  className?: string;
}

const ExampleTemplates = ({
  dataType,
  onSelectExample,
  className = "",
}: ExampleTemplatesProps) => {
  const filteredExamples = examples.filter((example) => {
    if (dataType === "prompts") return example.type === "text";
    if (dataType === "images") return example.type === "image";
    return false;
  });

  if (filteredExamples.length === 0) return null;

  return (
    <div className={cn(className, "space-y-2")}>
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
