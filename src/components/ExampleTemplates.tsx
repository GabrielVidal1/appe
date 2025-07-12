import { Badge } from "@/components/ui/badge";
import { EXAMPLES } from "@/lib/constants";
import { ExampleTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

interface ExampleTemplatesProps {
  prompt?: string;
  className?: string;
}

const ExampleTemplates = ({
  prompt,
  className = "",
}: ExampleTemplatesProps) => {
  const { setValue } = useFormContext();

  const handleSelectExample = ({
    dataType,
    example,
    prompt,
  }: ExampleTemplate) => {
    setValue("dataType", dataType);
    setValue("prompt", prompt);
    setValue("example", example);
    const randomCount = Math.ceil(Math.floor(Math.random() * 5000) + 1000);
    setValue("dataCount", randomCount);

    if (dataType === "images") {
      setValue("imageSize", { width: 512, height: 512 });
    } else if (dataType === "pdfs") {
      const pageNumber = Math.ceil(Math.floor(Math.random() * 10) + 10);
      const tokenPerPage = Math.ceil(Math.floor(Math.random() * 1500) + 1000);
      setValue("pdfData", { pages: pageNumber, tokenPerPage });
    }
  };

  return (
    <div
      className={cn(
        className,
        "space-y-2 overflow-x-scroll pointer-events-none"
      )}
    >
      <div className="flex gap-2 flex-nowrap justify-end ">
        {EXAMPLES.map((example) => (
          <Badge
            key={example.name}
            variant="outline"
            className={cn(
              "pointer-events-auto",
              "cursor-pointer hover:bg-gray-100 transition-colors bg-white dark:bg-gray-800 text-nowrap",
              {
                "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
                  prompt === example.prompt,
              }
            )}
            onClick={() => handleSelectExample(example)}
          >
            {example.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ExampleTemplates;
