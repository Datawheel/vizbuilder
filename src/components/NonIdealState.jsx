import React from "react";
import {useTranslation} from "../toolbox/useTranslation";

const NonIdealState = () => {
  const {translate: t} = useTranslation();

  return <div className="vizbuilder-nonidealstate">
    <h1 className="vizbuilder-nonidealstate-header">
      {t("title.nonidealstate")}
    </h1>
  </div>;
};

export default NonIdealState;
