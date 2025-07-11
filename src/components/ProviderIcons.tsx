import { Bot } from "lucide-react";
import MistralIcon from "./icons/MistralIcons";

export const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "openai":
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/selfhst/icons/svg/openai.svg"
          alt="OpenAI"
          className="h-4 w-4"
        />
      );
    case "claude": // https://cdn.jsdelivr.net/gh/selfhst/icons/svg/claude.svg
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/selfhst/icons/svg/claude.svg"
          alt="Claude"
          className="h-4 w-4"
        />
      );
    case "mistral":
      return <MistralIcon className="h-4 w-4" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};
