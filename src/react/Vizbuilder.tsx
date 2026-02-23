import {Modal, Pagination, rem, SimpleGrid} from "@mantine/core";
import {useElementSize, usePagination} from "@mantine/hooks";
import cls from "clsx";
import React, {useCallback, useMemo, useState} from "react";
import {generateCharts} from "../charts/generator";
import {castArray} from "../toolbox/array";
import {calculateLayout} from "../toolbox/layout";
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
    pagination: paginationEnabled,
    suggestedWidth,
    NonIdealState,
    ViewErrorComponent,
  } = useVizbuilderContext();

  const [chartIndex, setChartIndex] = useState(-1);

  const {ref, width, height} = useElementSize();

  const charts = useMemo(() => {
    return generateCharts(datasets, {
      chartLimits,
      chartTypes,
      datacap,
      getTopojsonConfig,
    });
  }, [chartLimits, chartTypes, datacap, datasets, getTopojsonConfig]);

  // Calculate a tentative layout in case of using pagination
  const pageLayout = useMemo(() => {
    return calculateLayout({
      containerWidth: width,
      containerHeight: height,
      gap: 16,
      totalItems: charts.length,
      targetCellWidth: suggestedWidth,
      minCellWidth: suggestedWidth * 0.86,
    });
  }, [charts.length, height, suggestedWidth, width]);

  const pagination = usePagination({total: pageLayout.length, initialPage: 1});

  // biome-ignore lint/correctness/useExhaustiveDependencies(NonIdealState): non guaranteed stable
  const content = useMemo(() => {
    if (charts.length === 0) {
      if (datasets.length > 0 && datasets[0].data.length === 1) {
        return <NonIdealState status="one-row" />;
      }
      return <NonIdealState status="empty" />;
    }

    const pageIndex = Math.min(pageLayout.length, pagination.active) - 1;
    const layout = pageLayout[pageIndex];
    const sliceStart = pageLayout
      .slice(0, pageIndex)
      .reduce((sum, layout) => sum + layout.itemsPerPage, 0);
    const sliceEnd = paginationEnabled ? sliceStart + layout.itemsPerPage : undefined;
    const chartsToRender = charts.slice(sliceStart, sliceEnd);
    console.log(layout, sliceStart, sliceEnd);

    const breakpoints = paginationEnabled
      ? [{minWidth: 1, cols: layout.columns}]
      : [
          {minWidth: "xs", cols: 1},
          {minWidth: "md", cols: 2},
          {minWidth: "lg", cols: 3},
          {minWidth: "xl", cols: 4},
        ];

    const grid = (
      <SimpleGrid
        ref={ref}
        breakpoints={breakpoints}
        className={cls("vb-scrollcontainer", {unique: chartsToRender.length === 1})}
        style={{flex: "1 0"}}
      >
        {chartsToRender.map((chart, index) => (
          <ChartCard
            key={chart.key}
            chart={chart}
            onFocus={() => setChartIndex(sliceStart + index)}
            style={paginationEnabled ? {height: "100%"} : undefined}
          />
        ))}
      </SimpleGrid>
    );

    if (!paginationEnabled) return grid;

    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexFlow: "column nowrap",
          gap: rem(16),
        }}
      >
        {grid}
        <Pagination
          style={{flex: "0 0 auto"}}
          onChange={pagination.setPage}
          position="center"
          total={pageLayout.length}
          value={pagination.active}
        />
      </div>
    );
  }, [
    charts,
    datasets,
    pagination.active,
    pagination.setPage,
    paginationEnabled,
    ref,
    pageLayout,
  ]);

  const closeModal = useCallback(() => setChartIndex(-1), []);

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
