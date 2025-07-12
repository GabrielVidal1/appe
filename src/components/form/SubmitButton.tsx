import { cn } from "@/lib/utils";
import { getProviderIcon } from "../ProviderIcons";
import { Button } from "../ui/button";

interface SubmitButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  update?: boolean;

  className?: string;
}

const SubmitButton = ({
  onClick,
  disabled,
  update,
  className,
}: SubmitButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "w-fit bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg",
        className
      )}
      disabled={disabled}
    >
      {update ? "Update prices" : "Show provider prices"}
      <div className="flex items-center gap-2 ml-2 ">
        {getProviderIcon("openai", "group-hover:animate-spin")}
        {getProviderIcon("claude", "group-hover:animate-spin")}
        {getProviderIcon("mistral", "group-hover:animate-spin")}
      </div>
    </Button>
  );
};

export default SubmitButton;
