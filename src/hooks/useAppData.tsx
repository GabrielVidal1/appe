import { AppContext } from "@/contexts/form/contexts";
import { AppData } from "@/types/appData";
import { useContext } from "react";
import { useFormContext } from "react-hook-form";

export const useAppData = () => {
  const methods = useFormContext<AppData>();

  const appDataContext = useContext(AppContext);
  if (!appDataContext) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }

  return {
    ...methods,
    ...appDataContext,
  };
};
