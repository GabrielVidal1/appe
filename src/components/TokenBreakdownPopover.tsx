import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenBreakdownData {
  inputTokens: {
    text: number;
    document: number;
    image: number;
    total: number;
  };
  outputTokens: number;
}

interface TokenBreakdownPopoverProps {
  data: TokenBreakdownData;
  className?: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

const TokenBreakdownPopover: React.FC<TokenBreakdownPopoverProps> = ({ data, className }) => {
  const chartData = [
    {
      name: 'Input Text',
      value: data.inputTokens.text,
      color: COLORS[0],
    },
    {
      name: 'Document',
      value: data.inputTokens.document,
      color: COLORS[1],
    },
    {
      name: 'Image',
      value: data.inputTokens.image,
      color: COLORS[2],
    },
    {
      name: 'Output',
      value: data.outputTokens,
      color: COLORS[3],
    },
  ].filter(item => item.value > 0);

  const renderCustomLabel = ({ percent }: { percent: number }) => {
    return percent > 5 ? `${(percent * 100).toFixed(0)}%` : '';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-auto p-1", className)}>
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="top">
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
                  formatter={(value: number) => [value.toLocaleString(), 'tokens']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1">{item.name}</span>
                <span className="font-mono">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TokenBreakdownPopover;