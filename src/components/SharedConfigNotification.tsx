import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useConfigFromUrl } from "@/hooks/useConfigFromUrl";
import { clearConfigFromUrl } from "@/lib/urlConfig";
import { Info, X } from "lucide-react";
import { useState } from "react";

export const SharedConfigNotification = () => {
  const { isConfigFromUrl, configName } = useConfigFromUrl();
  const [isVisible, setIsVisible] = useState(true);

  const handleClearConfig = () => {
    clearConfigFromUrl();
    setIsVisible(false);
    // Optionally reload the page to reset form to defaults
    window.location.reload();
  };

  if (!isConfigFromUrl || !isVisible) {
    return null;
  }

  return (
    <div className="mb-4">
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex flex-col">
            {configName && (
              <span className="text-blue-900 dark:text-blue-100 font-semibold mb-1">
                Configuration: {configName}
              </span>
            )}
            <span className="text-blue-800 dark:text-blue-200">
              You&apos;re viewing a shared configuration. The form has been
              pre-filled with the shared values.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearConfig}
              className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
            >
              Reset to defaults
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
