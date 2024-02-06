import cls from "clsx";
import React, {useMemo} from "react";
import {normalizeMeasureConfig} from "../toolbox/props";
import {useCharts} from "../toolbox/useCharts";
import {TranslationProvider} from "../toolbox/useTranslation";
import {ChartCard} from "./ChartCard";
import NonIdealState from "./NonIdealState";
import {Grid, Modal, Paper, useMantineTheme} from "@mantine/core";
import {useMediaQuery} from "@mantine/hooks";

/** @type {React.FC<VizBldr.VizbuilderProps>} */
export const Vizbuilder = props => {
  const {
    charts,
    currentChart,
    currentPeriod,
    setCurrentChart
  } = useCharts(props);

  const isSingleChart = charts.length === 1;

  const theme = useMantineTheme();
  const screenIsXL = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`);
  const screenIsLG = useMediaQuery(`(min-width: ${theme.breakpoints.lg})`);
  const screenIsMD = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);

  const content = useMemo(() => {
    const measureConfig = normalizeMeasureConfig(props.measureConfig);
    const filteredCharts = charts
      .filter((d, i) => charts.findIndex(c => c.key === d.key) === i); // removes duplicate charts

    const columns = filteredCharts.length === 1 ? 1
      : filteredCharts.length === 2 ? screenIsMD ? 2 : 1
      : filteredCharts.length === 3 ? screenIsLG ? 3 : screenIsMD ? 2 : 1
      : screenIsXL ? 4 : screenIsLG ? 3 : screenIsMD ? 2 : 1;

    if (filteredCharts.length > 0) {
      return (
        <Grid
          columns={columns}
          w="100%"
          className={cls("vb-charts-wrapper", {unique: filteredCharts.length === 1})}
        >
          {filteredCharts.map(chart =>
            <Grid.Col key={chart.key} span={1}>
              <Paper shadow="xs">
                <ChartCard
                  chart={chart}
                  currentChart={""}
                  currentPeriod={currentPeriod}
                  downloadFormats={props.downloadFormats}
                  isSingleChart={isSingleChart}
                  key={chart.key}
                  measureConfig={measureConfig}
                  onToggle={() => setCurrentChart(chart.key)}
                  showConfidenceInt={props.showConfidenceInt}
                  userConfig={props.userConfig}
                />
              </Paper>
            </Grid.Col>
          )}
        </Grid>
      );
    }

    const Notice = props.nonIdealState || NonIdealState;
    return <Notice />;
  }, [currentChart, currentPeriod, charts, props.showConfidenceInt, screenIsXL, screenIsLG, screenIsMD]);

  const focusContent = useMemo(() => {
    const measureConfig = normalizeMeasureConfig(props.measureConfig);

    const chart = charts.find(chart => chart && (currentChart ? chart.key === currentChart : false));
    if (!chart) return null;

    return (
      <ChartCard
        chart={chart}
        currentChart={currentChart}
        currentPeriod={currentPeriod}
        downloadFormats={props.downloadFormats}
        isSingleChart={true}
        key={`${chart.key}-focus`}
        measureConfig={measureConfig}
        onToggle={() => setCurrentChart("")}
        showConfidenceInt={props.showConfidenceInt}
        userConfig={props.userConfig}
      />
    );

  }, [currentChart, currentPeriod, charts, props.showConfidenceInt]);

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
};
