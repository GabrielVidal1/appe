import { FormProvider, useForm } from "react-hook-form";
import { FormDataContext } from "./type";

const FormContextProvider = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm<FormDataContext>({
    defaultValues: {
      dataCount: 1000,
      dataType: "prompts",
      prompt: "",
      example: "",
      imageSize: { width: 512, height: 512 },
      pdfData: { pages: 10, tokenPerPage: 500 },
      modelSize: "medium",
      modelCapabilities: [],
      selectedTiers: ["small", "medium", "big"],
      selectedProviders: ["claude", "mistral", "openai"],
      showColumns: {
        size: false,
        inputOutput: false,
        tags: true,
      },
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default FormContextProvider;
