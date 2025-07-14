import { parseConfigFromUrl } from "@/lib/urlConfig";
import { DEFAULT_APP_DATA } from "@/types/appData";
import { values } from "lodash";
import { useMemo } from "react";

export const useConfigFromUrl = () => {
  const config = useMemo(() => {
    const urlConfig = parseConfigFromUrl();
    return values(urlConfig).length > 0
      ? { ...DEFAULT_APP_DATA, ...urlConfig }
      : null;
  }, []);

  return {
    config,
    isConfigFromUrl: !!config && Object.keys(config).length > 0,
    configName: config?.configName,
  };
};
