
import { cn } from "@/lib/utils";

interface HelpSubject {
  subject: string;
  content: string;
  image_url?: string;
}

interface HelpSubjectListProps {
  subjects: HelpSubject[];
  selectedSubject: string;
  onSubjectSelect: (subject: string) => void;
}

const HelpSubjectList = ({ subjects, selectedSubject, onSubjectSelect }: HelpSubjectListProps) => {
  return (
    <div className="w-1/3 border-r p-4">
      <h3 className="font-semibold mb-4">Help Topics</h3>
      <div className="space-y-2">
        {subjects.map((item) => (
          <button
            key={item.subject}
            onClick={() => onSubjectSelect(item.subject)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              "hover:bg-muted",
              selectedSubject === item.subject
                ? "bg-primary/10 border border-primary/20"
                : ""
            )}
          >
            <div className="font-medium text-sm">{item.subject}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HelpSubjectList;
