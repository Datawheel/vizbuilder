import {translationFactory} from "@datawheel/use-translation";

/** @type {VizBldr.Translation} */
const LOCALE_EN = {
  action_close: "Close",
  action_download: "Download {format}",
  action_enlarge: "Enlarge",
  action_fileissue: "File an issue",
  action_retry: "Retry",
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
  sentence_connectors: {
    all_words: ", ",
    two_words: " and ",
    last_word: ", and "
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
