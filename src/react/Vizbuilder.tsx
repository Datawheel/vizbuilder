import {Modal, SimpleGrid} from "@mantine/core";
import cls from "clsx";
import React, {useCallback, useMemo, useState} from "react";
import {generateCharts} from "../charts/generator";
import {castArray} from "../toolbox/array";
import type {Dataset} from "../types";
import {ChartCard} from "./ChartCard";
import {NonIdealState} from "./NonIdealState";
import {useVizbuilderContext} from "./VizbuilderProvider";

export type VizbuilderProps = React.ComponentProps<typeof Vizbuilder>;

/** */
export function Vizbuilder(props: {
  /**
   * The datasets to extract the charts from.
   */
  datasets: Dataset | Dataset[];

  /**
   * Custom className to apply to the component wrapper.
   *
   * @default
   */
  className?: string;

  /**
   * A ReactNode to render above the main charts area.
   *
   * @default undefined
   */
  customHeader?: React.ReactNode;

  /**
   * A ReactNode to render under the main charts area.
   *
   * @default undefined
   */
  customFooter?: React.ReactNode;
}) {
  const {datasets} = props;

  const {
    chartLimits,
    chartTypes,
    datacap,
    getTopojsonConfig,
    NonIdealState,
  } = useVizbuilderContext();

  const [currentChart, setCurrentChart] = useState("");

  // Compute possible charts
  const charts = useMemo(() => {
    const charts = generateCharts(castArray(datasets), {
      chartLimits,
      chartTypes,
      datacap,
      getTopojsonConfig,
    });
    return Object.fromEntries(charts.map(chart => [chart.key, chart]));
  }, [chartLimits, chartTypes, datacap, datasets, getTopojsonConfig]);

  const content = useMemo(() => {
    const chartList = Object.values(charts);

    if (chartList.length === 0) {
      return <NonIdealState />;
    }

    const isSingleChart = chartList.length === 1;

    return (
      <SimpleGrid
        breakpoints={[
          {minWidth: "xs", cols: 1},
          {minWidth: "md", cols: 2},
          {minWidth: "lg", cols: 3},
          {minWidth: "xl", cols: 4},
        ]}
        className={cls("vb-scrollcontainer", {unique: isSingleChart})}
      >
        {chartList.map(chart => (
          <ChartCard
            key={chart.key}
            chart={chart}
            onFocus={() => setCurrentChart(chart.key)}
          />
        ))}
      </SimpleGrid>
    );
  }, [charts, NonIdealState]);

  const focusContent = useMemo(() => {
    const chart = charts[currentChart];

    if (!chart) return null;

    return (
      <ChartCard
        key={`${chart.key}-focus`}
        chart={chart}
        onFocus={() => setCurrentChart("")}
        isFullMode
      />
    );
  }, [charts, currentChart]);

  return (
    <div className={cls("vb-wrapper", props.className)}>
      {props.customHeader}
      {content}
      {props.customFooter}
      <Modal
        centered
        onClose={useCallback(() => setCurrentChart(""), [])}
        opened={currentChart !== ""}
        padding={0}
        size="calc(100vw - 3rem)"
        styles={{
          content: {maxHeight: "none !important"},
          inner: {padding: "0 !important"},
        }}
        withCloseButton={false}
      >
        {focusContent}
      </Modal>
    </div>
  );
}
