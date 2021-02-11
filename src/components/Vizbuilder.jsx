import cls from "classnames";
import React, {useEffect, useMemo} from "react";
import {normalizeMeasureConfig, resizeEnsureHandler, scrollEnsureHandler} from "../toolbox/props";
import {useCharts} from "../toolbox/useCharts";
import {TranslationProvider} from "../toolbox/useTranslation";
import {ChartCard} from "./ChartCard";

/** @type {React.FC<VizBldr.VizbuilderProps>} */
export const Vizbuilder = props => {
  const {
    charts,
    currentChart,
    currentPeriod,
    setCurrentChart,
    setCurrentPeriod
  } = useCharts(props);

  const content = useMemo(() => {
    const isUniqueChart = charts.length === 1;
    const isSingleChart = currentChart !== "" && charts.length > 1;
    const measureConfig = normalizeMeasureConfig(props.measureConfig);

    return charts
      .filter(chart => chart && (currentChart ? chart.key === currentChart : true))
      .map(chart =>
        <ChartCard
          chart={chart}
          currentChart={currentChart}
          currentPeriod={currentPeriod}
          isSingleChart={isSingleChart}
          isUniqueChart={isUniqueChart}
          key={chart.key}
          measureConfig={measureConfig}
          onPeriodChange={(periodL, periodR) => setCurrentPeriod([periodL, periodR || ""])}
          onToggle={() => setCurrentChart(currentChart ? "" : chart.key)}
          showConfidenceInt={props.showConfidenceInt}
          userConfig={props.userConfig}
        />
      );
  }, [currentChart, currentPeriod, charts, props.showConfidenceInt]);

  useEffect(() => {
    requestAnimationFrame(resizeEnsureHandler);
  }, [content]);

  return (
    <TranslationProvider
      defaultLocale={props.defaultLocale}
      translations={props.translations}
    >
      <div
        className={cls("vb-wrapper", props.className)}
        onScroll={scrollEnsureHandler}
      >
        <div className="vb-toolbar-wrapper">
          {props.toolbar}
        </div>
        <div className={cls("vb-charts-wrapper", {unique: content.length === 1})}>
          {content}
        </div>
      </div>
    </TranslationProvider>
  );
};
