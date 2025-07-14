import { computeTokens } from "@/lib/computations";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { AppData, DataType } from "@/types/appData";
import { TokenResults } from "@/types/results";
import { chain } from "lodash";
import React, { useMemo } from "react";

interface TokenSummaryProps {
  data: AppData;
}

type TokenType = keyof TokenResults["inputTokens"];

const DATA_TO_TOKEN_TYPE: Record<DataType, TokenType[]> = {
  images: ["image", "text", "total"],
  pdfs: ["document", "text", "total"],
  prompts: ["text", "total"],
};

const TokenSummary: React.FC<TokenSummaryProps> = ({ data }) => {
  const tokenStats = useMemo(() => computeTokens(data), [data]);

  const sortedInputTokens = chain(tokenStats.inputTokens)
    .entries()
    .sort(([type1, a], [type2, b]) => (type1 === "total" ? 1 : b - a))
    .map(
      ([type, tokens]) => [type as TokenType, tokens * data.dataCount] as const
    )
    .value();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Token Summary</h3>

      <table className="w-full">
        <tbody>
          {sortedInputTokens
            .filter(([tokenType, _]) =>
              DATA_TO_TOKEN_TYPE[data.dataType].includes(tokenType)
            )
            .map(([tokenType, tokens]) => (
              <tr key={tokenType} className="border-b">
                <td
                  className={cn("py-2 px-4", {
                    "font-bold": tokenType === "total",
                  })}
                >
                  {capitalizeFirstLetter(tokenType)}
                </td>
                <td className="py-2 px-4 text-right ">
                  <p
                    className="font-bold inline-block text-xl"
                    style={{ wordSpacing: "1em" }}
                  >
                    {tokens.toLocaleString()}
                  </p>{" "}
                  <p className="inline-block text-sm text-gray-500">tokens</p>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenSummary;
