import { FormDataContext } from "@/contexts/form/type";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { ShareConfigButton } from "./ShareConfigButton";

export const ConfigNameDisplay = () => {
  const { watch } = useFormContext<FormDataContext>();
  const configName = watch("configName");

  if (!configName?.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800",
        "flex items-center justify-between"
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
          {configName}
        </h2>
        <p className="text-sm text-blue-700 dark:text-blue-300">—</p>
        <p className="text-sm text-blue-700 dark:text-blue-300 italic opacity-70">
          Shared Configuration
        </p>
      </div>
      <ShareConfigButton />
    </div>
  );
};
