import { TextareaWithCounts } from "@/components/ui/textarea-with-counts";
import { useFormContext } from "react-hook-form";

const PromptInput = () => {
  const { watch, setValue } = useFormContext();
  const prompt = watch("prompt");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("prompt", e.target.value);
  };

  return (
    <div className="relative">
      <TextareaWithCounts
        id="prompt"
        placeholder="Enter your prompt here..."
        value={prompt || ""}
        onChange={handlePromptChange}
        rows={6}
        className="resize-none"
      />
    </div>
  );
};

export default PromptInput;
