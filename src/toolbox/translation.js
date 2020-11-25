import {createContext, createElement, useContext, useMemo, useState} from "react";

/** @type {React.Context<TranslationContextProps | undefined>} */
// @ts-ignore
const TranslationContext = createContext(undefined);

export const LOCALE_EN = {
  action_apply: "Apply",
  action_back: "Back",
  action_close: "Close",
  action_delete: "Delete",
  action_edit: "Edit",
  action_enlarge: "Enlarge",
  action_fileissue: "File an issue",
  action_newfilter: "Add filter",
  action_newgroup: "Add group",
  action_reset: "Reset",
  action_retry: "Retry",
  action_togglemoe: "Calculate Margins of Error",
  chart_labels: {
    ci: "Confidence Interval",
    moe: "Margin of Error",
    source: "Source",
    collection: "Collection",
    measure_share: "{{measureName}} (share)"
  },
  comparison: {
    EQ: "Equal to",
    HAS: "Contains the term",
    HT: "Higher than",
    HTE: "Higher than or equal to",
    LT: "Lower than",
    LTE: "Lower than or equal to",
    NEQ: "Not equal to"
  },
  error: {
    chartfail_detail: "This chart failed during rendering. You can try re-rendering it, or report the problem to us.",
    chartfail_title: "Chart render failed",
    empty_detail: "The server doesn't have data for the parameters you requested.\nPlease try again with more broad filters, members, or drilldowns, or file an issue.",
    empty_title: "Empty dataset",
    internal_detail: "There was an internal error in Vizbuilder.\nIf this keeps happening, please file an issue including the permalink and/or an screenshot of the parameters in the sidebar.",
    internal_title: "Internal error",
    message: "Error details: \"{{message}}\".",
    network_detail: "There was an error during the connection to the server. This might be a problem with your internet connection, or with the data source server.\nPlease try again later, or file an issue.",
    network_title: "Network error",
    nocharts_detail: "This is probably an issue with vizbuilder.\nPlease file an issue indicating the set of parameters that outputted this result.",
    nocharts_title: "No charts could be computed with these parameters.",
    overload_detail: "The parameters defined returned too many data points. Please try a query with less granularity.",
    overload_title: "Too much data",
    server_detail: "The server had an internal problem while processing your request. Please try again later, or if the problem persists, file an issue.",
    server_title: "Server error",
    unknown_detail: "An unexpected error happened.\nIf this keeps happening, please file an issue including the permalink and/or an screenshot of the parameters in the sidebar.",
    unknown_title: "Unknown error"
  },
  placeholder_select: "Select...",
  prefix_dataset: "Dataset: ",
  prefix_source: "Source: ",
  title_areacharts: "Visualizations",
  title_areasidebar: "Visualization controls",
  title_bottomten: "Bottom 10 ({{timePeriod}})",
  title_filters: "Filter by",
  title_groups: "Grouped by",
  title_measure: "Showing",
  title_ranking: "Ranking ({{timePeriod}})",
  title_source: "Source information",
  title_topten: "Top 10 ({{timePeriod}})"
};

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
