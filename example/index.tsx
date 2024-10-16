import {
  Badge,
  Flex,
  Header,
  Loader,
  MantineProvider,
  SegmentedControl,
} from "@mantine/core";
import {D3plusContext} from "d3plus-react";
import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import {FormatterProvider} from "../src/components/FormatterProvider";
import {Vizbuilder} from "../src/index";
import {TranslationProvider} from "../src/toolbox/translation";
import {useQueries} from "./QueriesProvider";
import {QueryManager} from "./QueryManager";
import {TesseractProvider, useTesseract, useTesseractData} from "./TesseractProvider";
import {Vizdebugger} from "./Vizdebugger";

const topojsonConfig = Object.fromEntries(
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
  ].map(item => [item.id, item]),
);

const translations = {
  ar: {
    action_close: "يغلق",
    action_enlarge: "تكبير",
    action_fileissue: "قدم مشكلة",
    action_retry: "أعد المحاولة",
    aggregators: {
      avg: "متوسط",
      max: "أقصى",
      min: "الحد الأدنى",
    },
    chart_labels: {
      ci: "فاصل الثقة",
      moe: "هامش الخطأ",
      source: "مصدر",
      collection: "مجموعة",
    },
    error: {
      detail: "",
      message: 'التفاصيل: "{{message}}".',
      title: "خطأ",
    },
    nonidealstate_msg: "لا نتائج",
    sentence_connectors: {
      and: "و",
    },
    title: {
      of_selected_cut_members: "من أعضاء {{members}} المختارين",
      top_drilldowns: "لأفضل {{members}}",
      by_drilldowns: "بواسطة {{drilldowns}}",
      over_time: "متأخر , بعد فوات الوقت",
      measure_and_modifier: "{{modifier}} {{measure}}",
      total: "مجموع",
    },
  },
};

const container = document.getElementById("app");
container && mount(container);

const modeOptions = ["Vizdebugger", "Vizbuilder"];

const rtlLanguages = ["ar", "he", "fa", "ur", "yi", "dv"];

function App() {
  const [mode, setMode] = useState("Vizdebugger");

  const {currentQuery} = useQueries();

  const {availableDataLocale, dataLocale, setDataLocale} = useTesseract();

  const {dataset, isLoading, error} = useTesseractData(currentQuery);

  const Vizwrapper = mode === "Vizbuilder" ? Vizbuilder : Vizdebugger;

  return (
    <div style={{height: "100vh", backgroundColor: "#f0f0f0"}}>
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
            <Badge color="red" variant="filled" title={error}>
              Error
            </Badge>
          )}
          {isLoading && <Loader />}
        </Flex>
      </Header>

      <div
        id="viz-scroller"
        style={{
          direction: rtlLanguages.includes(dataLocale) ? "rtl" : "ltr",
          overflowY: "scroll",
          flex: "1 0 auto",
          padding: "0.75rem",
          boxSizing: "border-box",
        }}
      >
        <Vizwrapper
          datasets={dataset || []}
          downloadFormats={["svg", "png"]}
          topojsonConfig={topojsonConfig}
          userConfig={{
            locale: "ar-SA",
            scrollContainer: "#viz-scroller",
          }}
        />
      </div>
    </div>
  );
}

function mount(container) {
  const formatters = {
    Seconds: secondFormatter,
    Percentage: value => `${value}%`,
    Rate: value => `${value * 100}%`,
  };

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
