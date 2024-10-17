import {format, formatAbbreviate} from "d3plus-format";
import React, {createContext, useContext, useMemo, useRef, useState} from "react";
import type {TesseractMeasure} from "../schema";

/**
 * A function that converts a numeric value into a stylized string.
 * Might be influenced by the locale of the context.
 */
export type Formatter = (value: number, locale?: string) => string;

/** The name of a Formatter, or the string template used to generate it */
type Format = string;

export const defaultFormatters = {
  undefined: n => n,
  identity: n => `${n}`,
  Decimal: new Intl.NumberFormat(undefined, {useGrouping: false}).format,
  Dollars: new Intl.NumberFormat(undefined, {style: "currency", currency: "USD"}).format,
  Human: n => formatAbbreviate(n, "en-US"),
  Milliards: new Intl.NumberFormat(undefined, {useGrouping: true}).format,
};

export const basicFormatterKeys = ["Decimal", "Milliards", "Human"];

export interface FormatterContextValue {
  /**
   * Stores the format choice made by the user during the session.
   */
  currentFormats: Record<string, Format>;
  /**
   * Returns a list of formatter names that are available for a specified measure.
   */
  getAvailableFormats: (item: TesseractMeasure) => Format[];
  /**
   * Returns the Format currently assigned to a measure.
   */
  getFormat: (item: TesseractMeasure) => Format;
  /**
   * Stores the user's choice of Format for a measure.
   */
  setFormat: (item: TesseractMeasure, key: Format) => void;
  /**
   * Returns the corresponding Formatter for the provided Format.
   */
  getFormatter: (key: Format | TesseractMeasure) => Formatter;
}

const FormatterContext = createContext<FormatterContextValue | undefined>(undefined);

/** */
export function FormatterProvider(props: {
  items: Record<Format, Formatter>;
  children: React.ReactNode;
}) {
  // This will store the user choices of formatter for the measures used in the session
  const [formatMap, setFormatMap] = useState<Record<string, Format>>({});

  const formatterMap = useRef(props.items);

  const value = useMemo<FormatterContextValue>(() => {
    return {
      currentFormats: formatMap,
      getAvailableFormats(measure) {
        const formatterKeys = basicFormatterKeys.slice();
        const {format_template, units_of_measurement} = measure.annotations;
        units_of_measurement && formatterKeys.unshift(units_of_measurement);
        format_template && formatterKeys.unshift(format_template);
        return formatterKeys;
      },
      getFormat,
      setFormat,
      getFormatter(item) {
        const key = typeof item === "object" ? getFormat(item) : item;
        let formatter = formatterMap.current[key] || defaultFormatters[key];
        if (formatter) return formatter;

        // If formatter key is three uppercase letters, assume currency
        if (/^[A-Z]{3}$/.test(key)) {
          const formatter = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: key,
          }).format;
          formatterMap.current[key] = formatter;
          return formatter;
        }

        // At this point formatter key is assumed a template
        try {
          formatter = format(key);
        } catch {
          console.warn(`Formatter not configured: "${key}"`);
          formatter = defaultFormatters.identity;
        }
        formatterMap.current[key] = formatter;
        return formatter;
      },
    };

    function setFormat(measure: TesseractMeasure, format: Format) {
      setFormatMap(formatMap => ({...formatMap, [measure.name]: format}));
    }

    function getFormat(measure: TesseractMeasure) {
      const {format_template, units_of_measurement} = measure.annotations;
      return (
        formatMap[measure.name] || format_template || units_of_measurement || "identity"
      );
    }
  }, [formatMap]);

  return (
    <FormatterContext.Provider value={value}>{props.children}</FormatterContext.Provider>
  );
}

/**
 * React Hook to get a list of available formatters and store the user preferences.
 * Available formatting functions are stored in the `formatters` object, available
 * from the Settings context. The user choice of formatter for each measure is
 * stored in the `currentFormats` object.
 * The resulting object is memoized, so can also be used as dependency.
 */
export function useFormatter(): FormatterContextValue {
  const context = useContext(FormatterContext);
  if (!context) {
    throw new Error("Hook useFormatter must be used inside a FormatterProvider node.");
  }
  return context;
}
