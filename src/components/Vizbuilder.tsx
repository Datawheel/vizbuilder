import { Modal, SimpleGrid } from "@mantine/core";
import cls from "clsx";
import React, { useMemo, useState } from "react";
import { VizbuilderProps } from "../..";
import { asArray } from "../toolbox/array";
import { generateCharts, measureConfigAccessor } from "../toolbox/generateCharts";
import { TranslationProvider } from "../toolbox/useTranslation";
import { ChartCard } from "./ChartCard";
import NonIdealState from "./NonIdealState";

/** */
export function Vizbuilder(props: VizbuilderProps) {
  const [currentChart, setCurrentChart] = useState("");

  const getMeasureConfig = useMemo(() =>
    measureConfigAccessor(props.measureConfig || {}), [props.measureConfig]);

  const charts = useMemo(() => generateCharts(asArray(props.queries), {
    chartLimits: props.chartLimits,
    chartTypes: props.chartTypes,
    datacap: props.datacap,
    topojsonConfig: props.topojsonConfig
  }), [props.queries]);

  const content = useMemo(() => {
    const isSingleChart = charts.length === 1;
    const chartMap = new Map(charts.map(item => [item.key, item]));
    const filteredCharts = [...chartMap.values()];

    if (filteredCharts.length > 0) {
      return (
        <SimpleGrid
          breakpoints={[
            {minWidth: "xs", cols: 1}, {minWidth: "md", cols: 2},
            {minWidth: "lg", cols: 3}, {minWidth: "xl", cols: 4}
          ]}
          className={cls({unique: filteredCharts.length === 1})}
        >
          {filteredCharts.map(chart =>
            <ChartCard
              chart={chart}
              currentChart={""}
              downloadFormats={props.downloadFormats}
              isSingleChart={isSingleChart}
              key={chart.key}
              measureConfig={getMeasureConfig}
              onToggle={() => setCurrentChart(chart.key)}
              showConfidenceInt={props.showConfidenceInt}
              userConfig={props.userConfig}
            />
          )}
        </SimpleGrid>
      );
    }

    const Notice = props.nonIdealState || NonIdealState;
    return <Notice />;
  }, [currentChart, charts, props.showConfidenceInt]);

  const focusContent = useMemo(() => {
    const chart = charts.find(chart => currentChart && chart.key === currentChart);
    if (!chart) return null;

    return (
      <ChartCard
        chart={chart}
        currentChart={currentChart}
        downloadFormats={props.downloadFormats}
        isSingleChart={true}
        key={`${chart.key}-focus`}
        measureConfig={getMeasureConfig}
        onToggle={() => setCurrentChart("")}
        showConfidenceInt={props.showConfidenceInt}
        userConfig={props.userConfig}
      />
    );

  }, [currentChart, charts, props.showConfidenceInt]);

  return (
    <TranslationProvider
      defaultLocale={props.defaultLocale}
      translations={props.translations}
    >
      <div className={cls("vb-wrapper", props.className)}>
        {props.toolbar && <div className="vb-toolbar-wrapper">
          {props.toolbar}
        </div>}
        {content}
        <Modal
          centered
          onClose={() => setCurrentChart("")}
          opened={currentChart !== ""}
          padding={0}
          size="calc(100vw - 3rem)"
          styles={{
            content: {maxHeight: "none !important"},
            inner: {padding: "0 !important"}
          }}
          withCloseButton={false}
        >
          {focusContent}
        </Modal>
      </div>
    </TranslationProvider>
  );
}
