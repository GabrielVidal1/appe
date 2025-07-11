import { FormDataContext } from "@/contexts/form/type";
import { useFormContext } from "react-hook-form";

export const useFormState = <Key extends keyof FormDataContext>(key: Key) => {
  const { watch, setValue } = useFormContext();

  const value = watch(key);

  const setFormValue = (
    newValue:
      | FormDataContext[Key]
      | ((prevValue: FormDataContext[Key]) => FormDataContext[Key])
  ) => {
    if (typeof newValue === "function") {
      newValue = newValue(value);
    }
    setValue(key, newValue as any);
  };

  return [value, setFormValue] as const;
};
