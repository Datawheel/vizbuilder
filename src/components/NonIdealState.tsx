import React from "react";
import {useTranslation} from "../toolbox/translation";

export function NonIdealState() {
  const {translate: t} = useTranslation();

  return <div className="vizbuilder-nonidealstate">
    <h1 className="vizbuilder-nonidealstate-header">
      {t("title.nonidealstate")}
    </h1>
  </div>;
};
