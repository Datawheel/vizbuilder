import {translationFactory} from "@datawheel/use-translation";

export const defaultTranslation = {
  action_close: "Close",
  action_enlarge: "Enlarge",
  action_fileissue: "File an issue",
  action_retry: "Retry",
  aggregator: {
    average: "Average {{measure}}",
    max: "Max {{measure}}",
    min: "Min {{measure}}",
    sum: "{{measure}}",
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
  list: {
    join: ", ",
    suffix: "{{rest}}, and {{item}}",
    prefix: "{{list}}",
    n_more: "{{n}} more",
  },
  title: {
    main_on_period: "{{values}} by {{series}} on {{time_period}}",
    main_over_period: "{{values}} by {{series}} over {{time}}",
    main: "{{values}} by {{series}}",
    measure_on_period: "{{values}} on {{time_period}}",
    measure_over_period: "{{values}} over {{time}}",
    nonidealstate: "No results",
    series_members: "{{series}} ({{members}})",
    series: "{{series}}",
    time_range: "in {{from}}-{{to}}",
    total: "Total: {{value}}",
  },
};

export type Translation = typeof defaultTranslation;

export const {useTranslation, TranslationConsumer, TranslationProvider} =
  translationFactory({defaultLocale: "en", defaultTranslation});
