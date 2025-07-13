import { TextareaWithCounts } from "@/components/ui/textarea-with-counts";
import { computeImagePrice } from "@/lib/imageCost";
import { AppData } from "@/types/appData";
import { FileImage, FileText } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

const PromptInput = () => {
  const { watch, setValue } = useFormContext<AppData>();
  const prompt = watch("prompt");
  const dataType = watch("dataType");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("prompt", e.target.value);
  };

  const imageSize = watch("imageSize");
  const { tokens: imageToken } = useMemo(
    () => computeImagePrice("anthropic", imageSize.width, imageSize.height),
    [imageSize]
  );

  const pdfData = watch("pdfData");
  const pdfToken = useMemo(() => {
    return pdfData ? pdfData.pages * pdfData.tokenPerPage : 0;
  }, [pdfData]);

  return (
    <div className="relative">
      <TextareaWithCounts
        id="prompt"
        placeholder="Enter your prompt here..."
        value={prompt || ""}
        onChange={handlePromptChange}
        rows={8}
        className="resize-none"
      />
      {dataType === "images" && (
        <div className="bg-white border p-2 shadow-sm rounded-xl absolute bottom-2 right-2 text-xs text-gray-500 flex flex-col items-center gap-1">
          <FileImage className="h-10 w-10" />
          <p>~{imageToken.toFixed()} tokens</p>
        </div>
      )}
      {dataType === "pdfs" && (
        <div className="group/aa bg-white border p-2 shadow-sm rounded-xl absolute bottom-2 right-2 text-xs text-gray-500 flex flex-col items-center gap-1">
          <FileText className="h-10 w-10" />
          <div className="hidden group-hover/aa:flex flex-col items-center">
            <p>pages x tokens/page</p>
            <p>
              {pdfData?.pages} x {pdfData?.tokenPerPage}
            </p>
          </div>

          <p>
            <p className="hidden group-hover/aa:inline">=</p>
            <p className="inline group-hover/aa:hidden">+ </p>
            {pdfToken.toFixed()} tokens
          </p>
        </div>
      )}
    </div>
  );
};

export default PromptInput;
