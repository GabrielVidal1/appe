import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
  show?: boolean;
}

const HelpButton = ({ onClick, className, show = true }: HelpButtonProps) => {
  if (!show) return null;

  return (
    <Button
      className={cn("h-8 w-8 p-0 shrink-0", className)}
      variant="outline"
      size="sm"
      onClick={onClick}
      title="Get help"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
};

export default HelpButton;
