import { cn } from "@/lib/utils";
import { Provider } from "@/types/model";
import { Bot } from "lucide-react";
import AnthropicIcon from "./icons/AnthropicIcon";
import MistralIcon from "./icons/MistralIcons";
import OpenAIIcon from "./icons/OpenAIIcon";

export const getProviderIcon = (provider: Provider, className?: string) => {
  switch (provider) {
    case "openai":
      return <OpenAIIcon className={cn(className, "h-5 w-5 align-middle")} />;
    case "anthropic":
      return (
        <AnthropicIcon className={cn(className, "h-5 w-5 align-middle")} />
      );
    case "mistral":
      return <MistralIcon className={cn(className, "h-5 w-5 align-middle")} />;
    default:
      return <Bot className={cn(className, "h-5 w-5 align-middle")} />;
  }
};
