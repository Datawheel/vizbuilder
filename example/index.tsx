import {
  AppShell,
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
import {Vizbuilder, VizbuilderProvider, Vizdebugger} from "../src/react";

import {FormatterProvider, useFormatter} from "./FormatterProvider";
import {formatters} from "./formatters";
import {useQueries} from "./QueriesProvider";
import {QueryManager} from "./QueryManager";
import {TesseractProvider, useTesseract, useTesseractData} from "./TesseractProvider";
import {TranslationProvider} from "./TranslationProvider";
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

function App() {
  const networkStatus = useNetwork();

  const [mode, setMode] = useState("Vizdebugger");

  const {currentQuery} = useQueries();

  const {availableDataLocale, dataLocale, setDataLocale} = useTesseract();

  const {dataset, isLoading, error} = useTesseractData(currentQuery);

  const {getFormatter} = useFormatter();

  const Vizwrapper = mode === "Vizbuilder" ? Vizbuilder : Vizdebugger;

  const header = (
    <Header height={50} p="xs" withBorder zIndex={0}>
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
  );

  return (
    <AppShell
      padding="xs"
      header={header}
      styles={theme => ({
        root: {
          height: "100vh",
          overflow: "auto",
        },
        main: {
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[1],
        },
      })}
    >
      <VizbuilderProvider
        pagination
        downloadFormats={["svg", "png"]}
        topojsonConfig={topojsonConfig}
        getFormatter={getFormatter}
        postprocessConfig={config => ({
          ...config,
          scrollContainer: ".mantine-AppShell-root",
        })}
      >
        <Vizwrapper
          datasets={dataset || []}
          style={{
            flex: "1 0 0",
            height: "100%",
            boxSizing: "border-box",
          }}
        />
      </VizbuilderProvider>
    </AppShell>
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
