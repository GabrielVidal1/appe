import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExampleTemplate {
  name: string;
  type: "prompts" | "images";
  prompt: string;
  output: string;
}

const examples: ExampleTemplate[] = [
  {
    name: "Translation",
    type: "prompts",
    prompt: "Translate the following sentence to French",
    output: '{ "translation": "Bonjour le monde" }',
  },
  {
    name: "Summarization",
    type: "prompts",
    prompt: "Summarize the following article in one sentence",
    output:
      '{ "summary": "The article discusses the impact of climate change on global weather patterns." }',
  },
  {
    name: "Image Description",
    type: "images",
    prompt: "Describe the content of this image",
    output:
      "The image shows a beautiful sunset over a mountain range with a clear sky.",
  },
];

interface ExampleTemplatesProps {
  prompt?: string;
  onSelectExample: (dataType: string, prompt: string, output: string) => void;
  className?: string;
}

const ExampleTemplates = ({
  prompt,
  onSelectExample,
  className = "",
}: ExampleTemplatesProps) => {
  if (examples.length === 0) return null;

  return (
    <div className={cn(className, "space-y-2")}>
      <div className="flex flex-wrap gap-2">
        {/* <p className="text-sm">Examples</p> */}
        {examples.map((example) => (
          <Badge
            key={example.name}
            variant="outline"
            className={cn(
              "cursor-pointer hover:bg-gray-100 transition-colors",
              {
                "bg-blue-50 text-blue-800": prompt === example.prompt,
              }
            )}
            onClick={() =>
              onSelectExample(example.type, example.prompt, example.output)
            }
          >
            {example.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ExampleTemplates;
