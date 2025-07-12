import { Badge } from "@/components/ui/badge";
import { EXAMPLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  return (
    <div className={cn(className, "space-y-2 overflow-x-scroll")}>
      <div className="flex gap-2 flex-nowrap justify-end">
        {EXAMPLES.map((example) => (
          <Badge
            key={example.name}
            variant="outline"
            className={cn(
              "cursor-pointer hover:bg-gray-100 transition-colors bg-white dark:bg-gray-800 text-nowrap",
              {
                "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
                  prompt === example.prompt,
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
