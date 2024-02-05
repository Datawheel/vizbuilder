import React, {useState} from "react";
import ReactDOM from "react-dom";
import {Vizdebugger} from "../src/components/Vizdebugger";
import {Vizbuilder} from "../src/index";
import {QueryManager} from "./QueryManager";
import {useQuery} from "./useQuery";
import {useQueryParams} from "./useQueryParams";
import {useDisclosure} from "@mantine/hooks";
import {Button, Flex} from "@mantine/core";
import {D3plusContext} from "d3plus-react";

const d3plusConfig = {
  colorScalePosition: "bottom"
};

const topojsonArray = [
  {
    id: "Province",
    name: "مقاطعة",
    topojson: "/topojson/SA_regions.json",
    topojsonId: (d) => d.properties.id,
  },
  {
    id: "Destination Country",
    name: "دولة",
    topojson: "/topojson/world-50m.json",
    topojsonId: (d) => d.id,
    projection: "geoMiller",
  },
  {
    id: "Source Country",
    name: "دولة",
    topojson: "/topojson/world-50m.json",
    topojsonId: (d) => d.id,
    projection: "geoMiller",
  },
];
const topojsonConfig = topojsonArray.reduce((acc, item) => ({...acc, [item.id]: item}), {});

const translations = {
  "ar": {
    "action_close": "يغلق",
    "action_enlarge": "تكبير",
    "action_fileissue": "قدم مشكلة",
    "action_retry": "أعد المحاولة",
    "aggregators": {
      "avg": "متوسط",
      "max": "أقصى",
      "min": "الحد الأدنى"
    },
    "chart_labels": {
      "ci": "فاصل الثقة",
      "moe": "هامش الخطأ",
      "source": "مصدر",
      "collection": "مجموعة"
    },
    "error": {
      "detail": "",
      "message": "التفاصيل: \"{{message}}\".",
      "title": "خطأ"
    },
    "nonidealstate_msg": "لا نتائج",
    "sentence_connectors": {
      "and": "و"
    },
    "title": {
      "of_selected_cut_members": "من أعضاء {{members}} المختارين",
      "top_drilldowns": "لأفضل {{members}}",
      "by_drilldowns": "بواسطة {{drilldowns}}",
      "over_time": "متأخر , بعد فوات الوقت",
      "measure_and_modifier": "{{modifier}} {{measure}}",
      "total": "مجموع"
    }
  }
}

function Demo() {
  const [isDebugging, setDebugger] = useDisclosure(true);
  const [currentQuery, setCurrentQuery] = useState("");

  const Vizwrapper = isDebugging ? Vizdebugger : Vizbuilder;

  const [query] = useQueryParams(currentQuery);
  console.log(query);
  const [result, error] = useQuery(query);

  return (
    <Flex direction="row">
      <Flex direction="column" gap="sm" align="center" p="sm" w={300} miw={300}>
        <Button compact uppercase color="indigo" onClick={setDebugger.toggle}>
          {Vizwrapper.name}
        </Button>
        <QueryManager currentQuery={currentQuery} onChange={setCurrentQuery} />
      </Flex>
      <div id="viz-scroller" style={{overflowY: "scroll", height: "100vh"}}>
        <D3plusContext.Provider value={d3plusConfig}>
          {result && <Vizwrapper
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
              "treemap"
            ]}
            topojsonConfig={topojsonConfig}
            translations={translations}
            userConfig={{
              locale: "ar-SA",
              scrollContainer: "#viz-scroller",
            }}
          />}
        </D3plusContext.Provider>
      </div>
    </Flex>
  );
}

ReactDOM.render(
  React.createElement(Demo),
  document.getElementById("app")
);
