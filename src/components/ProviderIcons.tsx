import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import MistralIcon from "./icons/MistralIcons";

export const getProviderIcon = (provider: string, className?: string) => {
  switch (provider.toLowerCase()) {
    case "openai":
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/selfhst/icons/svg/openai.svg"
          alt="OpenAI"
          className={cn(className, "h-4 w-4")}
        />
      );
    case "claude": // https://cdn.jsdelivr.net/gh/selfhst/icons/svg/claude.svg
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/selfhst/icons/svg/claude.svg"
          alt="Claude"
          className={cn(className, "h-4 w-4")}
        />
      );
    case "mistral":
      return <MistralIcon className={cn(className, "h-4 w-4")} />;
    default:
      return <Bot className={cn(className, "h-4 w-4")} />;
  }
};
