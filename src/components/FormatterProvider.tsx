import React, {createContext, useContext, useMemo, useRef} from "react";

export type Formatter = (value: number, locale?: string) => string;

interface FormatterContextValue {
  getFormatter(name: string): Formatter;
}

const FormatterContext = createContext<FormatterContextValue | undefined>(undefined);

export function FormatterProvider(props: {
  children: React.ReactNode;
}) {
  const formatters = useRef();

  const value = useMemo<FormatterContextValue>(() => {
    return {
      getFormatter(name: string) {},
    };
  }, []);
  return (
    <FormatterContext.Provider value={value}>{props.children}</FormatterContext.Provider>
  );
}

export function useFormatter(): FormatterContextValue {
  const context = useContext(FormatterContext);
  if (!context) {
    throw new Error("Hook useFormatter must be used inside a FormatterProvider node.");
  }
  return context;
}
