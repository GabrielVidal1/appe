
import { Textarea } from "@/components/ui/textarea";
import ExampleTemplates from "@/components/ExampleTemplates";
import { useFormContext } from "react-hook-form";

const PromptInput = () => {
  const { watch, setValue } = useFormContext();
  const prompt = watch("prompt");
  const dataType = watch("dataType");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("prompt", e.target.value);
  };

  const handleExampleSelect = (examplePrompt: string, exampleOutput: string) => {
    setValue("prompt", examplePrompt);
    const currentExamples = watch("examples") || [""];
    const newExamples = [...currentExamples];
    newExamples[0] = exampleOutput;
    setValue("examples", newExamples);
  };

  return (
    <div className="space-y-2 relative">
      <Textarea
        id="prompt"
        placeholder="Example prompt..."
        value={prompt || ""}
        onChange={handlePromptChange}
        rows={4}
        className="resize-none"
      />
      {!prompt?.trim() && (
        <ExampleTemplates
          className="absolute bottom-2 right-2"
          dataType={dataType}
          onSelectExample={handleExampleSelect}
        />
      )}
    </div>
  );
};

export default PromptInput;
