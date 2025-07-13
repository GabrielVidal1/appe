import { parseConfigFromUrl } from "@/lib/urlConfig";
import { AppData, DEFAULT_FORM_VALUES } from "@/types/appData";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";

const FormContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Parse URL config if present
  const urlConfig = useMemo(() => parseConfigFromUrl(), []);

  const methods = useForm<AppData>({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...urlConfig, // Override with URL config if present
    },
  });

  const { setValue } = methods;

  // Update form values if URL config is present
  useEffect(() => {
    if (urlConfig) {
      Object.entries(urlConfig).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof AppData, value as AppData[keyof AppData]);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConfig]);

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default FormContextProvider;
