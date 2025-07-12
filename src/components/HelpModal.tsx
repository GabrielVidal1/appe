
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import HelpSubjectList from "./HelpSubjectList";
import helpData from "@/data/help.json";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpModal = ({ open, onOpenChange }: HelpModalProps) => {
  const [selectedSubject, setSelectedSubject] = useState(helpData[0]?.subject || "");
  
  const selectedHelpItem = helpData.find(item => item.subject === selectedSubject) || helpData[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Help & Documentation</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[60vh]">
          <HelpSubjectList
            subjects={helpData}
            selectedSubject={selectedSubject}
            onSubjectSelect={setSelectedSubject}
          />
          
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{selectedHelpItem.subject}</h2>
            
            {selectedHelpItem.image_url && (
              <div className="mb-4">
                <img
                  src={selectedHelpItem.image_url}
                  alt={selectedHelpItem.subject}
                  className="w-full max-w-md h-48 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              {selectedHelpItem.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
