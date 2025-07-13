import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AppData } from "@/types/appData";
import { TokenResults } from "@/types/results";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TokenBreakdownPopoverProps {
  data: AppData;
  results: TokenResults;
  className?: string;
  children: React.ReactNode;
}

const COLORS = [
  "#3b82f6", // Blue for Input Text
  "#10b981", // Green for Document
  "#f59e0b", // Orange for Image
  "#ef4444", // Red for Output
];

const TokenBreakdownPopover: React.FC<TokenBreakdownPopoverProps> = ({
  data,
  results,
  className,
  children,
}) => {
  const chartData = [
    {
      name: "Input Text",
      value: results.inputTokens.text * data.dataCount,
      color: COLORS[0],
    },
    {
      name: "Document",
      value: results.inputTokens.document * data.dataCount,
      color: COLORS[1],
    },
    {
      name: "Image",
      value: results.inputTokens.image * data.dataCount,
      color: COLORS[2],
    },
    {
      name: "Output",
      value: results.outputTokens * data.dataCount,
      color: COLORS[3],
    },
  ].filter((item) => item.value > 0);

  const renderCustomLabel = ({ percent }: { percent: number }) => {
    return percent > 5 ? `${(percent * 100).toFixed(0)}%` : "";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={cn("cursor-pointer", className)}>{children}</div>
      </PopoverTrigger>
      <PopoverContent
        className="animate-in fade-in-0 zoom-in-95 duration-150"
        side="top"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Token Breakdown</h4>
            <p className="text-sm text-muted-foreground">
              Distribution of tokens by type
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString(),
                    "tokens",
                  ]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  formatter={(value) => (
                    <span
                      className="w-full"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {value} tokens
                      <span className="ml-6 text-xs text-muted-foreground">
                        {chartData
                          .find((item) => item.name === value)
                          ?.value.toLocaleString()}
                      </span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TokenBreakdownPopover;
