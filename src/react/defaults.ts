import {formatAbbreviate} from "d3plus-format";

export const defaultFormatters = {
  undefined: n => n,
  identity: n => `${n}`,
  Decimal: new Intl.NumberFormat(undefined, {useGrouping: false}).format,
  Dollars: new Intl.NumberFormat(undefined, {style: "currency", currency: "USD"}).format,
  Human: n => formatAbbreviate(n, "en-US") as string,
  Milliards: new Intl.NumberFormat(undefined, {useGrouping: true}).format,
  Seconds(value: number) {
    const days = Math.floor(value / 86400);
    const hours = Math.floor(value / 3600) % 24;
    const mins = Math.floor(value / 60) % 60;
    const secs = Math.floor(value) % 60;
    return [
      days > 0 ? `${days}d` : "",
      days > 0 || hours > 0 ? `${hours}h` : "",
      days > 0 || hours > 0 || mins > 0 ? `${mins}m` : "",
      `${Math.floor(secs) !== secs ? secs.toFixed(3) : secs}s`,
    ]
      .filter(Boolean)
      .join("");
  },
};

export type Translation = typeof defaultTranslation;

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
    n_more: "{{n}} more",
  },
  title: {
    main: "{{values}} by {{series}}",
    main_on_period: "{{values}} by {{series}} on {{time_period}}",
    main_over_period: "{{values}} by {{series}} over {{time}}",
    measure_on_period: "{{values}} on {{time_period}}",
    measure_over_period: "{{values}} over {{time}}",
    nonidealstate: "No results",
    scale_day: "Daily",
    scale_month: "Monthly",
    scale_quarter: "Quarterly",
    scale_week: "Weekly",
    scale_year: "Yearly",
    series: "{{series}}",
    series_members: "{{series}} ({{members}})",
    time_range: "in {{from}}-{{to}}",
    total: "Total: {{value}}",
  },
  transient: {
    title_one_row: "The dataset has only one row and can't be used to generate charts.",
    title_loading: "Generating charts...",
    title_empty: "No results",
    description_empty:
      "The selected combination of parameters can't be used to generate a meaningful set of charts. Try changing some parameters (maybe applying some restriction in a column) and generating charts again.",
  },
};
