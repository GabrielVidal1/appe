import { FormDataContext } from "@/contexts/form/type";
import { DEFAULT_FORM_VALUES } from "@/lib/types";
import { parseConfigFromUrl } from "@/lib/urlConfig";
import { values } from "lodash";
import { useEffect, useState } from "react";

export const useConfigFromUrl = () => {
  const [config, setConfig] = useState<FormDataContext | null>(null);

  useEffect(() => {
    // Check if current URL has a config parameter
    const urlConfig = parseConfigFromUrl();
    setConfig(
      values(urlConfig).length > 0
        ? { ...DEFAULT_FORM_VALUES, ...urlConfig }
        : null
    );
  }, []);

  return {
    config,
    isConfigFromUrl: !!config && Object.keys(config).length > 0,
    configName: config?.configName,
  };
};
