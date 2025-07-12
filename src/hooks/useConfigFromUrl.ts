import { FormDataContext } from "@/contexts/form/type";
import { parseConfigFromUrl } from "@/lib/urlConfig";
import { useEffect, useState } from "react";

export const useConfigFromUrl = () => {
  const [config, setConfig] = useState<Partial<FormDataContext> | null>(null);

  useEffect(() => {
    // Check if current URL has a config parameter
    const urlConfig = parseConfigFromUrl();
    setConfig(urlConfig);
  }, []);

  return {
    config,
    isConfigFromUrl: !!config && Object.keys(config).length > 0,
    configName: config?.configName,
  };
};
