import ExampleTemplates from "@/components/ExampleTemplates";
import { TextareaWithCounts } from "@/components/ui/textarea-with-counts";
import { useFormContext } from "react-hook-form";

const PromptInput = () => {
  const { watch, setValue } = useFormContext();
  const prompt = watch("prompt");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("prompt", e.target.value);
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
        prompt={prompt}
      />
    </div>
  );
};

export default PromptInput;
