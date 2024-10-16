import {
  ActionIcon,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import {useDisclosure, useLocalStorage} from "@mantine/hooks";
import {IconWindowMaximize} from "@tabler/icons-react";
import React, {forwardRef, useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {VizbuilderProps} from "../src";
import {D3plusBarchart} from "../src/components/Barchart";
import {D3plusDonut} from "../src/components/Donut";
import {ErrorBoundary} from "../src/components/ErrorBoundary";
import {D3plusChoropleth} from "../src/components/Geomap";
import {D3plusLineplot} from "../src/components/Lineplot";
import {D3plusStacked} from "../src/components/StackedArea";
import {D3plusTreemap} from "../src/components/Treemap";
import {castArray} from "../src/toolbox/array";
import {type Chart, type ChartType, generateCharts} from "../src/toolbox/generateCharts";

const components: Record<
  ChartType,
  React.ComponentType<{config: Chart; fullMode: boolean}>
> = {
  barchart: D3plusBarchart,
  choropleth: D3plusChoropleth,
  donut: D3plusDonut,
  lineplot: D3plusLineplot,
  stackedarea: D3plusStacked,
  treemap: D3plusTreemap,
};

export function Vizdebugger(props: VizbuilderProps) {
  const {chartLimits, chartTypes, datacap, datasets, topojsonConfig} = props;

  const charts = useMemo(() => {
    const options = {chartLimits, chartTypes, datacap, topojsonConfig};
    const charts = generateCharts(castArray(datasets), options);
    return charts;
  }, [datasets, chartLimits, chartTypes, datacap, topojsonConfig]);

  const chartOptions = useMemo(
    () =>
      charts.map((chart, index) => ({
        chart,
        label: `${chart.key} - ${chart.values.measure.name}`,
        value: index,
      })),
    [charts],
  );

  const [chartIndex, setChartIndex] = useLocalStorage({
    key: "Vizdebugger:chartIndex",
    getInitialValueInEffect: false,
    defaultValue: 0,
  });
  const [fullMode, setFullMode] = useDisclosure(true);

  const chartConfig = charts[chartIndex];
  const ChartComponent = chartConfig && components[chartConfig.type];

  return (
    <SimpleGrid cols={2}>
      <div>
        <Title order={3} mb="xs">
          Dataset
        </Title>
        <Paper shadow="xs" p="xs">
          <ObjectInspector data={props.datasets} expandLevel={1} />
        </Paper>
        <Title order={3} mt="lg" mb="xs">
          Generated charts
        </Title>
        <SimpleGrid cols={3}>
          {charts.map((chart, index) => (
            <Paper key={chart.key} shadow="xs" p="xs" pos="relative">
              <ObjectInspector data={chart} expandLevel={1} />
              <ActionIcon
                sx={{position: "absolute", right: 0, bottom: 0, margin: "0.25rem"}}
                size="xs"
                onClick={() => setChartIndex(index)}
              >
                <IconWindowMaximize />
              </ActionIcon>
            </Paper>
          ))}
        </SimpleGrid>
      </div>
      <div>
        <Group grow mb="lg">
          <Select
            data={chartOptions}
            itemComponent={ChartItem}
            onChange={setChartIndex}
            value={chartIndex}
          />
          <Switch label="Full mode" checked={fullMode} onChange={setFullMode.toggle} />
        </Group>
        <ErrorBoundary>
          {chartConfig && ChartComponent && (
            <ChartComponent config={chartConfig} fullMode={fullMode} />
          )}
        </ErrorBoundary>
      </div>
    </SimpleGrid>
  );
}

const ChartItem = forwardRef<
  HTMLDivElement,
  {label: string; value: string; chart: Chart}
>((props, ref) => {
  const {chart, label, value, ...others} = props;
  const drilldowns = castArray(chart.series)
    .map(series => series.level.name)
    .join(", ");
  return (
    <div ref={ref} {...others}>
      <Text>{`${chart.type}: ${chart.key}`}</Text>
      <Text size="xs">{`${chart.values.measure.name} [${chart.values.measure.aggregator}] - ${drilldowns}`}</Text>
    </div>
  );
});
