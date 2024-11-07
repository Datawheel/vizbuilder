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
import {type Chart, generateCharts} from "../src/charts/generator";
import {ErrorBoundary} from "../src/react/ErrorBoundary";
import type {VizbuilderProps} from "../src/react/Vizbuilder";
import {useD3plusConfig} from "../src/react/useD3plusConfig";
import {castArray} from "../src/toolbox/array";

export function Vizdebugger(props: VizbuilderProps) {
  const {
    datasets,
    chartLimits,
    chartTypes,
    datacap,
    measureConfig,
    topojsonConfig,
    userConfig,
  } = props;

  // Normalize measureConfig to function type
  const getMeasureConfig = useMemo(() => {
    const config = measureConfig || {};
    return typeof config === "function" ? config : item => config[item.name];
  }, [measureConfig]);

  // Normalize topojsonConfig to function type
  const getTopojsonConfig = useMemo(() => {
    const config = topojsonConfig || {};
    return typeof config === "function" ? config : item => config[item.name];
  }, [topojsonConfig]);

  const charts = useMemo(
    () =>
      generateCharts(castArray(datasets), {
        chartLimits,
        chartTypes,
        datacap,
        getTopojsonConfig,
      }),
    [datasets, chartLimits, chartTypes, datacap, getTopojsonConfig],
  );

  const chartOptions = useMemo(
    () =>
      charts.map((chart, index) => ({
        chart,
        label: `${chart.key} - ${chart.values.measure.name}`,
        value: index,
      })),
    [charts],
  );

  const [fullMode, setFullMode] = useDisclosure(false);

  const [showConfidenceInt, setShowConfidenceInt] = useDisclosure(true);

  const [chartIndex, setChartIndex] = useLocalStorage({
    key: "Vizdebugger:chartIndex",
    getInitialValueInEffect: false,
    defaultValue: 0,
  });

  const chart = charts[chartIndex];

  const [ChartComponent, chartConfig] = useD3plusConfig(chart, {
    fullMode,
    showConfidenceInt,
    getMeasureConfig,
    t: i => i,
  });

  return (
    <SimpleGrid cols={2}>
      <div>
        <SimpleGrid cols={2}>
          <div>
            <Title order={3} mb="xs">
              Columns
            </Title>
            <Paper shadow="xs" p="xs">
              <ObjectInspector data={props.datasets} expandLevel={1} />
            </Paper>
          </div>

          <div>
            <Title order={3} mb="xs">
              d3plus config
            </Title>
            <Paper shadow="xs" p="xs">
              <ObjectInspector data={chartConfig} />
            </Paper>
          </div>
        </SimpleGrid>

        <Title order={3} mt="lg" mb="xs">
          All generated charts
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
          <Switch label="Featured" checked={fullMode} onChange={setFullMode.toggle} />
          <Switch
            label="Confidence Interval"
            checked={showConfidenceInt}
            onChange={setShowConfidenceInt.toggle}
          />
        </Group>
        <ErrorBoundary>
          {ChartComponent && <ChartComponent config={chartConfig} />}
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
