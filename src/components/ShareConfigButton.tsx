import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFormState } from "@/hooks/useFormState";
import { createShareableUrl } from "@/lib/urlConfig";
import { cn } from "@/lib/utils";
import { AppData } from "@/types/appData";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface ShareConfigButtonProps {
  icon?: React.ReactNode;
  className?: string;
  copyOnClick?: boolean;
}

export const ShareConfigButton = ({
  className,
  icon,
  copyOnClick = false,
}: ShareConfigButtonProps) => {
  const { toast } = useToast();
  const { getValues } = useFormContext<AppData>();
  const [shareUrl, setShareUrl] = useState<string>("");
  const [configName, setConfigName] = useFormState("configName");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generateShareUrl = () => {
    const formData = getValues();
    const url = createShareableUrl(formData, configName);
    setShareUrl(url);
    setIsOpen(true);
  };

  const updateShareUrl = () => {
    const formData = getValues();
    const url = createShareableUrl(formData, configName);
    setShareUrl(url);
  };

  const copyToClipboard = async (url?: string) => {
    try {
      await navigator.clipboard.writeText(url ?? shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  const generateAndCopyUrl = () => {
    const formData = getValues();
    const url = createShareableUrl(formData, configName);
    copyToClipboard(url);
    setShareUrl(url);
    toast({
      title: "Configuration URL copied!",
    });
  };

  if (copyOnClick) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={generateAndCopyUrl}
        className={cn("gap-2 aspect-square", className)}
        title="Share Link"
      >
        {icon ?? <Share2 className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={generateShareUrl}
          className={cn("gap-2 aspect-square", className)}
          title="Share Link"
        >
          {icon ?? <Share2 className="h-4 w-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Configuration</DialogTitle>
          <DialogDescription>
            Share your current form configuration with others using this link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="config-name">Configuration Name (Optional)</Label>
            <Input
              id="config-name"
              value={configName}
              onChange={(e) => {
                setConfigName(e.target.value);
                // Update URL when name changes
                if (shareUrl) {
                  setTimeout(updateShareUrl, 0);
                }
              }}
              placeholder="Enter a name for this configuration..."
              className="flex-1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-url">Shareable URL</Label>
            <div className="flex space-x-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard()}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {copied && (
            <p className="text-sm text-green-600 dark:text-green-400">
              URL copied to clipboard!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
