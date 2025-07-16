import {translationFactory} from "@datawheel/use-translation";
import {defaultTranslation} from "../src/react";

export const {useTranslation, TranslationConsumer, TranslationProvider} =
  translationFactory({defaultLocale: "en", defaultTranslation});
