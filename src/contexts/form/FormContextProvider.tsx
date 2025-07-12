import { DEFAULT_FORM_VALUES } from "@/lib/types";
import { parseConfigFromUrl } from "@/lib/urlConfig";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormDataContext } from "./type";

const FormContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Parse URL config if present
  const urlConfig = useMemo(() => parseConfigFromUrl(), []);

  const methods = useForm<FormDataContext>({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...urlConfig, // Override with URL config if present
    },
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
