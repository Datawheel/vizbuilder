import cls from "classnames";
import React, {useEffect, useMemo, useState} from "react";
import {asArray} from "../toolbox/array";
import {chartReducer} from "../toolbox/charts";
import {buildDatagroup} from "../toolbox/datagroup";
import {normalizeMeasureConfig, normalizeTopojsonConfig, resizeEnsureHandler, scrollEnsureHandler} from "../toolbox/props";
import {TranslationProvider} from "../toolbox/translation";
import {ChartCard, chartComponents} from "./ChartCard";

/** @type {React.FC<VizBldr.VizbuilderProps>} */
export const Vizbuilder = props => {
  const [currentChart, setCurrentChart] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState(() => new Date().getFullYear());

  /** @type {VizBldr.Struct.Chart[]} */
  const charts = useMemo(() => {
    const allowedChartTypes = props.allowedChartTypes || Object.keys(chartComponents);
    const datagroupProps = {
      datacap: props.datacap || 20000,
      getTopojsonConfig: normalizeTopojsonConfig(props.topojsonConfig)
    };
    return asArray(props.queries).reduce((charts, query) => {
      const datagroup = buildDatagroup(query, datagroupProps);
      return allowedChartTypes.reduce(chartReducer(datagroup), charts);
    }, []);
  }, [props.queries]);

  const toolbar = <div />;

  const content = useMemo(() => {
    const isUniqueChart = charts.length === 1;
    const isSingleChart = currentChart !== "" && charts.length > 1;
    const measureConfig = normalizeMeasureConfig(props.measureConfig);

    return charts
      .filter(chart => currentChart ? chart.key === currentChart : true)
      .map(chart =>
        <ChartCard
          chart={chart}
          currentChart={currentChart}
          currentPeriod={currentPeriod}
          isSingleChart={isSingleChart}
          isUniqueChart={isUniqueChart}
          key={chart.key}
          measureConfig={measureConfig}
          onPeriodChange={period => setCurrentPeriod(period.getFullYear())}
          onToggle={() => setCurrentChart(currentChart ? "" : chart.key)}
          showConfidenceInt={props.showConfidenceInt}
          userConfig={props.userConfig}
        />
      );
  }, [currentChart, currentPeriod, charts, props.showConfidenceInt]);

  useEffect(() => {
    requestAnimationFrame(resizeEnsureHandler);
  }, content);

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
          {toolbar}
        </div>
        <div className={cls("vb-charts-wrapper", {unique: content.length === 1})}>
          {content}
        </div>
      </div>
    </TranslationProvider>
  );
};
