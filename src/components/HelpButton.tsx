
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpButtonProps {
  onClick: () => void;
}

const HelpButton = ({ onClick }: HelpButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 shrink-0"
      title="Get help"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
};

export default HelpButton;
