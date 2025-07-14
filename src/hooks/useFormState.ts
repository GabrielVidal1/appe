import { AppData } from "@/types/appData";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";

export const useFormState = <
  Key extends keyof AppData,
  Value extends AppData[Key] = AppData[Key]
>(
  key: Key
) => {
  const { watch, setValue } = useFormContext<AppData>();

  const value = watch(key);

  const setFormValue = useCallback(
    (newValue: Value | ((prevValue: Value) => Value)) => {
      if (typeof newValue === "function") {
        newValue = newValue(value as Value) as Value;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(key, newValue as any);
    },
    [key, setValue, value]
  );

  return [value, setFormValue] as [
    Value,
    (newValue: Value | ((prevValue: Value) => Value)) => void
  ];
};
