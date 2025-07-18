import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ProcessingStage } from "@/pages/AIProcessing";

interface Stage {
  id: ProcessingStage;
  title: string;
  description: string;
}

interface StageIndicatorProps {
  stages: readonly Stage[];
  currentStage: ProcessingStage;
  onStageClick: (stage: ProcessingStage) => void;
  className?: string;
}

const StageIndicator: React.FC<StageIndicatorProps> = ({ 
  stages, 
  currentStage, 
  onStageClick,
  className 
}) => {
  const getCurrentStageIndex = () => stages.findIndex(s => s.id === currentStage);
  const currentIndex = getCurrentStageIndex();

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStageClick(stage.id)}
                  disabled={!isClickable}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/20 border-2 border-primary text-primary",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                    isClickable && "hover:scale-105 cursor-pointer",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <div className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}>
                    {stage.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stage.description}
                  </div>
                </div>
              </div>
              
              {index < stages.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-4 transition-colors duration-200",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { StageIndicator };