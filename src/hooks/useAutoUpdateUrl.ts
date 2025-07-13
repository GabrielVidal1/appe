import { updateUrlWithConfig } from "@/lib/urlConfig";
import { AppData } from "@/types/appData";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

interface UseAutoUpdateUrlOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export const useAutoUpdateUrl = (options: UseAutoUpdateUrlOptions = {}) => {
  const { enabled = false, debounceMs = 1000 } = options;
  const { watch } = useFormContext<AppData>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const subscription = watch((data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (data) {
          updateUrlWithConfig(data as AppData);
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [watch, enabled, debounceMs]);

  return null;
};
