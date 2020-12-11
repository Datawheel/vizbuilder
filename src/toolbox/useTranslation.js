import {createContext, createElement, useContext, useMemo, useState} from "react";
import {LOCALE_EN} from "./locale_en";

/** @type {React.Context<TranslationContextProps | undefined>} */
const TranslationContext = createContext(undefined);

/** @type {React.FC<TranslationProviderProps>} */
export const TranslationProvider = props => {
  const [locale, setLocale] = useState(props.defaultLocale || "en");

  /** @type {TranslateFunction} */
  const translate = useMemo(() => {
    const {translations = {}} = props;
    const dictionary = translations[locale] || LOCALE_EN;
    const braceRegex = /{(\d+|[a-z$_][a-z\d$_]*?(?:\.[a-z\d$_]*?)*?)}/gi;
    return (template, values) => !values
      ? `${dictionary[template] || template}`
      : `${dictionary[template] || template}`.replace(braceRegex, (_, key) => {
        const keySet = key.split(".");
        let result = values;
        for (let currentKey, i = 0; (currentKey = keySet[i]) != null; i++) {
          result = result ? result[currentKey] : result;
        }
        return `${result}`;
      });
  }, [locale]);

  return createElement(
    TranslationContext.Provider,
    {value: {locale, setLocale, translate}},
    props.children
  );
};

/** @type {React.FC<React.ConsumerProps<TranslationContextProps>>} */
export const TranslationConsumer = props => createElement(
  TranslationContext.Consumer,
  undefined,
  context => {
    if (context === undefined) {
      throw new Error("TranslationConsumer must be used within a TranslationProvider.");
    }
    return props.children(context);
  }
);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider.");
  }
  return context;
};

/**
 * @typedef {(template: string, data?: Record<string, string>) => string} TranslateFunction
 */

/**
 * @typedef TranslationContextProps
 * @property {(lang: string) => void} setLocale
 * @property {TranslateFunction} translate
 * @property {string} locale
 */

/**
 * @typedef TranslationProviderProps
 * @property {string} [defaultLocale]
 * @property {Record<string, any>} [translations]
 */
