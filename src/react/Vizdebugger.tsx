import {
  ActionIcon,
  AspectRatio,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import {useDisclosure, useLocalStorage} from "@mantine/hooks";
import {IconReload} from "@tabler/icons-react";
import {mapValues} from "lodash-es";
import React, {forwardRef, useCallback, useMemo} from "react";
import {ObjectInspector, TableInspector} from "react-inspector";

import {type Chart, generateCharts} from "../charts/generator";
import {castArray} from "../toolbox/array";
import {ChartCard} from "./ChartCard";
import {useD3plusConfig} from "./useD3plusConfig";
import type {VizbuilderProps} from "./Vizbuilder";
import {useVizbuilderContext} from "./VizbuilderProvider";

export function Vizdebugger(props: VizbuilderProps) {
  const {datasets} = props;

  const {chartLimits, chartTypes, datacap, getTopojsonConfig} = useVizbuilderContext();

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
        value: `${index}`,
      })),
    [charts],
  );

  const [fullMode, setFullMode] = useDisclosure(false);

  const [showConfidenceInt, setShowConfidenceInt] = useDisclosure(true);

  const [chartIndex, setChartIndex] = useLocalStorage({
    key: "Vizdebugger:chartIndex",
    getInitialValueInEffect: false,
    defaultValue: "0",
  });

  const chart = charts[chartIndex];

  const columnInfo = useMemo(() => {
    if (!castArray(props.datasets).length) return [];
    const {columns, data, locale} = Array.isArray(props.datasets)
      ? props.datasets[0]
      : props.datasets;
    const point = data[data.length - 1];
    return mapValues(columns, item => {
      if (item.type === "measure") {
        return {
          type: item.type,
          // entities: [item.parentMeasure, item.measure],
          example: point[item.name],
        };
      }
      if (item.type === "property") {
        return {
          type: item.type,
          // entities: [item.dimension, item.hierarchy, item.level, item.property],
          example: point[item.name],
        };
      }
      if (item.type === "level") {
        return {
          type: item.type,
          isID: item.isID,
          hasID: item.hasID,
          // entities: [item.dimension, item.hierarchy, item.level],
          example: point[item.name],
        };
      }
    });
  }, [props.datasets]);

  const refreshChartHandler = useCallback(() => {
    setChartIndex(`${charts.length + 2}`);
    setTimeout(() => {
      setChartIndex(chartIndex);
    }, 500);
  }, [chartIndex, charts.length]);

  return (
    <Flex
      style={props.style}
      id={props.id}
      h="100%"
      direction="row"
      align="center"
      wrap="nowrap"
    >
      <ScrollArea h="100%" style={{flex: "0 0 140px"}}>
        <Stack m="xs" spacing="xs">
          {charts.map((chart, index) => (
            <Paper
              key={chart.key}
              shadow="xs"
              p="xs"
              onClick={() => setChartIndex(`${index}`)}
            >
              <Text size="xs">{chart.key}</Text>
              <Text>{chart.type}</Text>
              {chart.type === "barchart" && <Text size="xs">{chart.orientation}</Text>}
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      <Stack h="100%" p="xs" style={{flex: "1 1 50%", overflow: "auto"}}>
        <TitledArea title="columns">
          <TableInspector data={columnInfo} expandLevel={2} />
        </TitledArea>

        {chart && (
          <SimpleGrid
            cols={1}
            breakpoints={[{minWidth: "60rem", cols: 2, spacing: "xs"}]}
          >
            <TitledArea title="chart object" withPaper>
              <ObjectInspector data={chart} expandLevel={1} />
            </TitledArea>

            <ChartConfigInspector
              chart={chart}
              fullMode={fullMode}
              showConfidenceInt={showConfidenceInt}
            />
          </SimpleGrid>
        )}
      </Stack>

      <Stack h="100%" p="xs" style={{flex: "1 0 50%", overflow: "auto"}}>
        <Flex direction="row" justify="space-between" align="center" wrap="nowrap">
          <Switch label="Featured" checked={fullMode} onChange={setFullMode.toggle} />
          <Switch
            label="Confidence Interval"
            checked={showConfidenceInt}
            onChange={setShowConfidenceInt.toggle}
          />
          <Group spacing="xs">
            <Select
              data={chartOptions}
              itemComponent={ChartItem}
              onChange={useCallback(
                (value: string | null) => setChartIndex(value || "0"),
                [],
              )}
              value={chartIndex}
            />
            <ActionIcon size="lg" variant="default" onClick={refreshChartHandler}>
              <IconReload size="1.125rem" />
            </ActionIcon>
          </Group>
        </Flex>

        {chart && (
          <AspectRatio ratio={4 / 3} w="100%">
            <ChartCard chart={chart} isFullMode={fullMode} style={{height: "100%"}} />
          </AspectRatio>
        )}
      </Stack>
    </Flex>
  );
}

function TitledArea(props: {
  title: string;
  children: React.ReactNode;
  withPaper?: boolean;
}) {
  return (
    <div>
      <Title order={3} size="sm">
        {props.title}
      </Title>
      {props.withPaper ? (
        <Paper shadow="xs" p="xs">
          {props.children}
        </Paper>
      ) : (
        props.children
      )}
    </div>
  );
}

function ChartConfigInspector(props: {
  chart: Chart;
  fullMode: boolean;
  showConfidenceInt: boolean;
}) {
  const {chart, fullMode, showConfidenceInt} = props;
  const [_, chartConfig] = useD3plusConfig(chart, {
    fullMode,
    showConfidenceInt,
  });
  return (
    <TitledArea title="d3plus config" withPaper>
      <ObjectInspector data={chartConfig} expandLevel={1} />
    </TitledArea>
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
      <Text size="xs">{`${chart.values.measure.name} [${chart.values.measure.aggregator}]`}</Text>
      <Text size="xs">{drilldowns}</Text>
    </div>
  );
});
