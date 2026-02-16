import {Modal, SimpleGrid} from "@mantine/core";
import cls from "clsx";
import React, {useCallback, useMemo, useState} from "react";
import {generateCharts} from "../charts/generator";
import {castArray} from "../toolbox/array";
import type {Dataset} from "../types";
import {ChartCard} from "./ChartCard";
import {ErrorBoundary} from "./ErrorBoundary";
import {useVizbuilderContext} from "./VizbuilderProvider";

Vizbuilder.displayName = "Vizbuilder";

export type VizbuilderProps = React.ComponentProps<typeof Vizbuilder>;

/** */
export function Vizbuilder(props: {
  /**
   * The datasets to extract the charts from.
   */
  datasets: Dataset | Dataset[];

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

  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const datasets = useMemo(() => castArray(props.datasets), [props.datasets]);

  const {
    chartLimits,
    chartTypes,
    datacap,
    getTopojsonConfig,
    ViewErrorComponent,
    NonIdealState,
  } = useVizbuilderContext();

  const [chartIndex, setChartIndex] = useState(-1);

  const closeModal = useCallback(() => setChartIndex(-1), []);

  const charts = useMemo(() => {
    return generateCharts(datasets, {
      chartLimits,
      chartTypes,
      datacap,
      getTopojsonConfig,
    });
  }, [chartLimits, chartTypes, datacap, datasets, getTopojsonConfig]);

  const content = useMemo(() => {
    if (charts.length === 0) {
      if (datasets.length > 0 && datasets[0].data.length === 1) {
        return <NonIdealState status="one-row" />;
      }
      return <NonIdealState status="empty" />;
    }

    return (
      <SimpleGrid
        breakpoints={[
          {minWidth: "xs", cols: 1},
          {minWidth: "md", cols: 2},
          {minWidth: "lg", cols: 3},
          {minWidth: "xl", cols: 4},
        ]}
        className={cls("vb-scrollcontainer", {unique: charts.length === 1})}
      >
        {charts.map((chart, index) => (
          <ChartCard key={chart.key} chart={chart} onFocus={() => setChartIndex(index)} />
        ))}
      </SimpleGrid>
    );
  }, [NonIdealState, charts, datasets]);

  const chart = charts[chartIndex];

  return (
    <div className={cls("vb-wrapper", props.className)} id={props.id} style={props.style}>
      {props.customHeader}

      <ErrorBoundary ErrorContent={ViewErrorComponent}>{content}</ErrorBoundary>

      {props.customFooter}

      <Modal
        centered
        onClose={closeModal}
        opened={chartIndex !== -1}
        padding={0}
        size="calc(100vw - 3rem)"
        styles={{
          content: {maxHeight: "none !important"},
          inner: {padding: "0 !important"},
        }}
        withCloseButton={false}
      >
        {chart && (
          <ChartCard
            key={`${chart.key}-focus`}
            chart={chart}
            onFocus={closeModal}
            isFullMode
          />
        )}
      </Modal>
    </div>
  );
}
