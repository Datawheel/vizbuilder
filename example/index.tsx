import {Box, Button, Flex, Header, Loader, MantineProvider} from "@mantine/core";
import {useToggle} from "@mantine/hooks";
import {D3plusContext} from "d3plus-react";
import React from "react";
import {createRoot} from "react-dom/client";
import {Vizbuilder} from "../src/index";
import {QueriesProvider, useQueries} from "./QueriesProvider";
import {QueryManager} from "./QueryManager";
import {TesseractProvider, useTesseractData} from "./TesseractProvider";
import {Vizdebugger} from "./Vizdebugger";

const topojsonArray = [
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
];
const topojsonConfig = topojsonArray.reduce(
  (acc, item) => ({...acc, [item.id]: item}),
  {},
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

function App() {
  const [Vizwrapper, toggleVizwrapper] = useToggle([Vizdebugger, Vizbuilder]);

  const {currentQuery} = useQueries();

  const {result, isLoading, error} = useTesseractData(currentQuery);

  return (
    <Box h="100vh">
      <Header height={51} p="xs" withBorder>
        <Flex direction="row" gap="xs" align="center" h={30}>
          <Button compact uppercase color="indigo" onClick={() => toggleVizwrapper()}>
            {Vizwrapper.name}
          </Button>
          <QueryManager />
          {isLoading && <Loader variant="bars"/>}
        </Flex>
      </Header>

      <div
        id="viz-scroller"
        style={{
          overflowY: "scroll",
          flex: "1 0 auto",
          padding: "0.75rem",
          boxSizing: "border-box",
        }}
      >
        {result && (
          <Vizwrapper
            queries={result}
            downloadFormats={["svg", "png"]}
            defaultLocale="ar"
            allowedChartTypes={[
              "barchart",
              "barchartyear",
              "donut",
              "geomap",
              "histogram",
              "lineplot",
              "pie",
              "stacked",
              "treemap",
            ]}
            topojsonConfig={topojsonConfig}
            translations={translations}
            userConfig={{
              locale: "ar-SA",
              scrollContainer: "#viz-scroller",
            }}
          />
        )}
      </div>
    </Box>
  );
}

function mount(container) {
  const root = createRoot(container);
  root.render(
    <TesseractProvider serverURL={new URL("/tesseract/", location.href)}>
      <QueriesProvider>
        <MantineProvider>
          <D3plusContext.Provider value={{colorScalePosition: "bottom"}}>
            <App />
          </D3plusContext.Provider>
        </MantineProvider>
      </QueriesProvider>
    </TesseractProvider>,
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
