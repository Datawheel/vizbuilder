import {translationFactory} from "@datawheel/use-translation";

export const defaultTranslation = {
  action_close: "Close",
  action_enlarge: "Enlarge",
  action_fileissue: "File an issue",
  action_retry: "Retry",
  aggregators: {
    avg: "Average",
    max: "Max",
    min: "Min",
    sum: "",
  },
  chart_labels: {
    ci: "Confidence Interval",
    moe: "Margin of Error",
    source: "Source",
    collection: "Collection",
  },
  error: {
    detail: "",
    message: 'Details: "{{message}}".',
    title: "Error",
  },
  sentence_connectors: {
    and: "and",
  },
  title: {
    by_drilldowns: "by {{drilldowns}}",
    measure_and_modifier: "{{modifier}} {{measure}}",
    measure_on_period: "{{measure}} on {{period}}",
    nonidealstate: "No results",
    of_selected_cut_members: "of Selected {{members}} Members",
    over_time: "Over Time",
    top_drilldowns: "for Top {{drilldowns}}",
    total: "Total",
  },
};

export type Translation = typeof defaultTranslation;

export const {useTranslation, TranslationConsumer, TranslationProvider} =
  translationFactory({defaultLocale: "en", defaultTranslation});
