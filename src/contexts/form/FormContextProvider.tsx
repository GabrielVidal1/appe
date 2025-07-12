import { parseConfigFromUrl } from "@/lib/urlConfig";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormDataContext } from "./type";

const FormContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Parse URL config if present
  const urlConfig = useMemo(() => parseConfigFromUrl(), []);

  // Merge URL config with default values
  const defaultValues: FormDataContext = {
    dataCount: 1000,
    dataType: "prompts",
    prompt: "",
    example: "",
    imageSize: { width: 512, height: 512 },
    pdfData: { pages: 10, tokenPerPage: 500 },
    modelSize: "medium",
    modelCapabilities: [],
    configName: "", // Default empty config name
    selectedTiers: ["small", "medium", "big"],
    selectedProviders: ["claude", "mistral", "openai"],
    showColumns: {
      size: false,
      inputOutput: false,
      tags: true,
    },
    ...urlConfig, // Override with URL config if present
  };

  const methods = useForm<FormDataContext>({
    defaultValues,
  });

  const { setValue } = methods;

  // Update form values if URL config is present
  useEffect(() => {
    if (urlConfig) {
      console.log(`Setting value from URL config:`, urlConfig);
      Object.entries(urlConfig).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(
            key as keyof FormDataContext,
            value as FormDataContext[keyof FormDataContext]
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConfig]);

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default FormContextProvider;
