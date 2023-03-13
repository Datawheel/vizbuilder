import { useState, useCallback, useEffect } from "react";

export function useStoredState<S>(
  key: string,
  initialValue: S,
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const recoverValue = () => {
    const value = localStorage.getItem(key);
    return value != null ? JSON.parse(value) as S : initialValue;
  };

  const [value, setValue] = useState<S>(recoverValue);

  useEffect(() => {
    setValue(recoverValue);
  }, [key]);

  return [value, useCallback((value: S) => {
    localStorage.setItem(key, JSON.stringify(value));
    setValue(value);
  }, [key])];
}
