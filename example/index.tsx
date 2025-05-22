import {
  Flex,
  Header,
  Loader,
  MantineProvider,
  SegmentedControl,
  ThemeIcon,
} from "@mantine/core";
import {useNetwork} from "@mantine/hooks";
import {IconExclamationCircle, IconPlugConnectedX} from "@tabler/icons-react";
import {D3plusContext} from "d3plus-react";
import {keyBy} from "lodash-es";
import React, {useState} from "react";
import {createRoot} from "react-dom/client";

import type {GeomapConfig} from "../src/d3plus";
import {
  ErrorBoundary,
  FormatterProvider,
  TranslationProvider,
  Vizbuilder,
  Vizdebugger,
} from "../src/react";
import {useQueries} from "./QueriesProvider";
import {QueryManager} from "./QueryManager";
import {TesseractProvider, useTesseract, useTesseractData} from "./TesseractProvider";
import {formatters} from "./formatters";
import {translations} from "./translations";

const topojsonConfig = keyBy(
  [
    {
      id: "Province",
      name: "مقاطعة",
      topojson: "/topojson/SA_regions.json",
      topojsonId: d => d.properties.id,
    },
    {
      id: "Destination Country",
      name: "دولة",
      topojson: "/topojson/world-50m.json",
      topojsonId: d => d.id,
      projection: "geoMiller",
    },
    {
      id: "Source Country",
      name: "دولة",
      topojson: "/topojson/world-50m.json",
      topojsonId: d => d.id,
      projection: "geoMiller",
    },
  ] as (GeomapConfig & {id: string; name: string})[],
  item => item.id,
);

const container = document.getElementById("app");
container && mount(container);

const modeOptions = ["Vizdebugger", "Vizbuilder"];

const rtlLanguages = ["ar", "he", "fa", "ur", "yi", "dv"];

function App() {
  const networkStatus = useNetwork();

  const [mode, setMode] = useState("Vizdebugger");

  const {currentQuery} = useQueries();

  const {availableDataLocale, dataLocale, setDataLocale} = useTesseract();

  const {dataset, isLoading, error} = useTesseractData(currentQuery);

  const Vizwrapper = mode === "Vizbuilder" ? Vizbuilder : Vizdebugger;

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column nowrap",
        height: "100vh",
        backgroundColor: "#f0f0f0",
      }}
    >
      <Header height={51} p="xs" withBorder>
        <Flex direction="row" gap="xs" align="center" h={30}>
          <SegmentedControl
            color="blue"
            data={modeOptions}
            value={mode}
            onChange={setMode}
          />
          <SegmentedControl
            tt="uppercase"
            data={availableDataLocale}
            value={dataLocale}
            onChange={setDataLocale}
          />
          <QueryManager />
          {error && (
            <ThemeIcon size="lg" color="red" title={error}>
              <IconExclamationCircle />
            </ThemeIcon>
          )}
          {isLoading && <Loader />}
          {!networkStatus.online && (
            <ThemeIcon size="lg" color="green" title="Disconnected">
              <IconPlugConnectedX />
            </ThemeIcon>
          )}
        </Flex>
      </Header>

      <div
        id="viz-scroller"
        style={{
          direction: rtlLanguages.includes(dataLocale) ? "rtl" : "ltr",
          overflowY: "auto",
          flex: "1 0 0",
          padding: "0.75rem",
          boxSizing: "border-box",
        }}
      >
        <ErrorBoundary>
          <Vizwrapper
            datasets={dataset || []}
            downloadFormats={["svg", "png"]}
            topojsonConfig={topojsonConfig}
            userConfig={() => ({
              scrollContainer: "#viz-scroller",
            })}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function mount(container) {
  const root = createRoot(container);
  root.render(
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <D3plusContext.Provider value={{colorScalePosition: "bottom"}}>
        <TesseractProvider serverURL={new URL("/tesseract/", location.href)}>
          <TranslationProvider defaultLocale="en" translations={translations}>
            <FormatterProvider items={formatters}>
              <App />
            </FormatterProvider>
          </TranslationProvider>
        </TesseractProvider>
      </D3plusContext.Provider>
    </MantineProvider>,
  );
}

function secondFormatter(value: number) {
  const days = Math.floor(value / 86400);
  const hours = Math.floor(value / 3600) % 24;
  const mins = Math.floor(value / 60) % 60;
  const secs = Math.floor(value) % 60;
  return [
    days > 0 ? `${days}d` : "",
    days > 0 || hours > 0 ? `${hours}h` : "",
    days > 0 || hours > 0 || mins > 0 ? `${mins}m` : "",
    `${Math.floor(secs) !== secs ? secs.toFixed(3) : secs}s`,
  ]
    .filter(Boolean)
    .join("");
}
