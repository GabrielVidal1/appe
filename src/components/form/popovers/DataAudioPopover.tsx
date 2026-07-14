import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEFAULT_AUDIO_TOKENS_PER_SECOND } from "@appe/core";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

const DEFAULT_AUDIO = {
  seconds: 60,
  tokensPerSecond: DEFAULT_AUDIO_TOKENS_PER_SECOND,
};

/** Format seconds as a compact "Xm Ys" / "Ys" label. */
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
};

const DataAudioPopover = () => {
  const { watch, setValue } = useFormContext();
  const audioData = watch("audioData") || DEFAULT_AUDIO;
  const [isOpen, setIsOpen] = useState(false);
  const [tempSeconds, setTempSeconds] = useState(audioData.seconds);
  const [tempTps, setTempTps] = useState(audioData.tokensPerSecond);

  const handleApply = () => {
    setValue("audioData", {
      seconds: tempSeconds,
      tokensPerSecond: tempTps,
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSeconds(audioData.seconds);
    setTempTps(audioData.tokensPerSecond);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          handleCancel();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="underline text-xl font-medium h-auto p-0 border-none shadow-none"
        >
          {formatDuration(audioData.seconds)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="seconds">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                value={tempSeconds}
                onChange={(e) => setTempSeconds(Number(e.target.value))}
                className="col-span-2 h-8"
                min="1"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="tokensPerSecond">Tokens/sec</Label>
              <Input
                id="tokensPerSecond"
                type="number"
                value={tempTps}
                onChange={(e) => setTempTps(Number(e.target.value))}
                className="col-span-2 h-8"
                min="1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ~32 tok/s matches Gemini &amp; most multimodal LLMs. Models with a
              dedicated audio price use it automatically.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DataAudioPopover;
