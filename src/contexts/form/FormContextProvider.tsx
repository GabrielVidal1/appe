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
      modelSize: "medium",
      modelCapabilities: [],
      selectedTiers: ["small", "medium", "big"],
      selectedProviders: ["claude", "mistral", "openai"],
      showColumns: {
        size: false,
        inputOutput: false,
      },
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default FormContextProvider;
