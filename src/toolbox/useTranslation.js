import {translationFactory} from "@datawheel/use-translation";

/** @type {VizBldr.Translation} */
const LOCALE_EN = {
  action_close: "Close",
  action_download: "Download {format}",
  action_enlarge: "Enlarge",
  action_fileissue: "File an issue",
  action_retry: "Retry",
  aggregators: {
    avg: "Average",
    max: "Max",
    min: "Min"
  },
  chart_labels: {
    ci: "Confidence Interval",
    moe: "Margin of Error",
    source: "Source",
    collection: "Collection"
  },
  error: {
    detail: "",
    message: "Error details: \"{message}\".",
    title: "Title: "
  },
  nonidealstate_msg: "No results",
  sentence_connectors: {
    all_words: ", ",
    two_words: " and ",
    last_word: ", and "
  },
  title: {
    of_selected_cut_members: "of Selected {members} Members",
    top_drilldowns: "for Top {drilldowns}",
    by_drilldowns: "by {drilldowns}",
    over_time: "Over Time"
  }
};

export const {
  useTranslation,
  TranslationConsumer,
  TranslationProvider
} = translationFactory({
  defaultLocale: "en",
  defaultTranslation: LOCALE_EN
});
