import React from "react";
import {useTranslation} from "./TranslationProvider";

export function NonIdealState() {
  const {translate: t} = useTranslation();

  return (
    <div className="vb-nonidealstate">
      <h1 className="vb-nonidealstate-header">{t("title.nonidealstate")}</h1>
    </div>
  );
}
