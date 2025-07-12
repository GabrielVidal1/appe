import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import ClaudeIcon from "./icons/ClaudeIcon";
import MistralIcon from "./icons/MistralIcons";
import OpenAIIcon from "./icons/OpenAIIcon";

export const getProviderIcon = (provider: string, className?: string) => {
  switch (provider.toLowerCase()) {
    case "openai":
      return <OpenAIIcon className={cn(className, "h-5 w-5 align-middle")} />;
    case "claude": // https://cdn.jsdelivr.net/gh/selfhst/icons/svg/claude.svg
      return <ClaudeIcon className={cn(className, "h-5 w-5 align-middle")} />;
    case "mistral":
      return <MistralIcon className={cn(className, "h-5 w-5 align-middle")} />;
    default:
      return <Bot className={cn(className, "h-5 w-5 align-middle")} />;
  }
};
