import ExampleTemplates from "@/components/ExampleTemplates";
import { TextareaWithCounts } from "@/components/ui/textarea-with-counts";
import { useFormContext } from "react-hook-form";

const PromptInput = () => {
  const { watch, setValue } = useFormContext();
  const prompt = watch("prompt");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("prompt", e.target.value);
  };

  const handleExampleSelect = (
    dataType: string,
    examplePrompt: string,
    exampleOutput: string
  ) => {
    setValue("prompt", examplePrompt);
    setValue("example", exampleOutput);

    const randomCount = Math.ceil(Math.floor(Math.random() * 5000) + 1000);
    setValue("dataCount", randomCount);
    setValue("dataType", dataType);
  };

  return (
    <div className="space-y-2 relative">
      <TextareaWithCounts
        id="prompt"
        placeholder="Example prompt"
        value={prompt || ""}
        onChange={handlePromptChange}
        rows={6}
        className="resize-none"
      />
      <ExampleTemplates
        className="absolute bottom-2 right-2 left-2"
        onSelectExample={handleExampleSelect}
        prompt={prompt}
      />
    </div>
  );
};

export default PromptInput;
