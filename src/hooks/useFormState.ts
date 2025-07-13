import { AppData } from "@/types/appData";
import { useFormContext } from "react-hook-form";

export const useFormState = <
  Key extends keyof AppData,
  Value extends AppData[Key] = AppData[Key]
>(
  key: Key
) => {
  const { watch, setValue } = useFormContext();

  const value: Value = watch(key);

  const setFormValue = (
    newValue: AppData[Key] | ((prevValue: AppData[Key]) => AppData[Key])
  ) => {
    if (typeof newValue === "function") {
      newValue = newValue(value);
    }
    setValue(key, newValue as any);
  };

  return [value, setFormValue] as const;
};
