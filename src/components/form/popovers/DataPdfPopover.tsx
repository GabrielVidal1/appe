import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

const DataPdfPopover = () => {
  const { watch, setValue } = useFormContext();
  const pdfData = watch("pdfData") || { pages: 10, tokenPerPage: 500 };
  const [isOpen, setIsOpen] = useState(false);
  const [tempPages, setTempPages] = useState(pdfData.pages);
  const [tempTokenPerPage, setTempTokenPerPage] = useState(
    pdfData.tokenPerPage
  );

  const handleApply = () => {
    setValue("pdfData", { pages: tempPages, tokenPerPage: tempTokenPerPage });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempPages(pdfData.pages);
    setTempTokenPerPage(pdfData.tokenPerPage);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          handleCancel();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="underline text-xl font-medium h-auto p-0 border-none shadow-none"
        >
          {pdfData.pages} pages
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="pages">Pages</Label>
              <Input
                id="pages"
                type="number"
                value={tempPages}
                onChange={(e) => setTempPages(Number(e.target.value))}
                className="col-span-2 h-8"
                min="1"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="tokenPerPage">Tokens/page</Label>
              <Input
                id="tokenPerPage"
                type="number"
                value={tempTokenPerPage}
                onChange={(e) => setTempTokenPerPage(Number(e.target.value))}
                className="col-span-2 h-8"
                min="1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DataPdfPopover;
