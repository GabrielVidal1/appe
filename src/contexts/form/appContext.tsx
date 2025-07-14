import { parseConfigFromUrl } from "@/lib/urlConfig";
import { AppData, DEFAULT_APP_DATA } from "@/types/appData";
import React, { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { AppContext } from "./contexts";

export const AppDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [appData, setAppData] = React.useState<AppData>(DEFAULT_APP_DATA);
  // Parse URL config if present
  const urlConfigPartial = useMemo(() => parseConfigFromUrl(), []);

  const urlConfig: AppData | null = useMemo(() => {
    if (urlConfigPartial) {
      return {
        ...DEFAULT_APP_DATA,
        ...urlConfigPartial,
      };
    }
    return null;
  }, [urlConfigPartial]);

  const methods = useForm<AppData>({
    defaultValues: urlConfig ?? DEFAULT_APP_DATA,
  });

  const { reset, subscribe } = methods;

  useEffect(() => {
    if (urlConfig) reset(urlConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConfig]);

  useEffect(() => {
    const callback = subscribe({
      formState: { values: true },
      callback: (state) => {
        setAppData(state.values);
      },
    });
    return () => callback();
  }, [subscribe]);

  const setAppDataFunc = (data: AppData) => {
    reset(data);
    setAppData(data);
  };

  return (
    <FormProvider {...methods}>
      <AppContext.Provider
        value={{
          isConfigFromUrl: !!urlConfig,
          urlConfig,
          defaultValues: DEFAULT_APP_DATA,
          appData,
          setAppData: setAppDataFunc,
        }}
      >
        {children}
      </AppContext.Provider>
    </FormProvider>
  );
};
