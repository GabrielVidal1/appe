import { cn } from "@/lib/utils";
import * as React from "react";

export interface TextareaWithCountsProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
}

const TextareaWithCounts = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithCountsProps
>(({ className, value = "", ...props }, ref) => {
  const [hoverCounts, setHoverCounts] = React.useState(false);

  // Calculate counts
  const showCounts = value.trim() !== "";
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const charCount = value.length;
  const tokenCount = Math.ceil(charCount / 4); // Rough estimation: ~4 chars per token

  return (
    <div className="relative w-full">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        {...props}
      />
      {showCounts && (
        <div
          className="absolute top-2 right-2 text-xs text-muted-foreground/70 leading-tight"
          onMouseEnter={() => setHoverCounts(true)}
          onMouseLeave={() => setHoverCounts(false)}
        >
          {hoverCounts ? (
            <div className="bg-white p-1 rounded-lg">
              <div>Words: {wordCount}</div>
              <div>Chars: {charCount}</div>
              <div>Tokens: ~{tokenCount}</div>
            </div>
          ) : (
            <div className="bg-white p-1 rounded-lg">{tokenCount} tokens</div>
          )}
        </div>
      )}
    </div>
  );
});
TextareaWithCounts.displayName = "TextareaWithCounts";

export { TextareaWithCounts };
