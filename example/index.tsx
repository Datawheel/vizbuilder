import React, {useState} from "react";
import ReactDOM from "react-dom";
import {Vizdebugger} from "../src/components/Vizdebugger";
import {Vizbuilder} from "../src/index";
import {QueryManager} from "./QueryManager";
import {useQuery} from "./useQuery";
import {useQueryParams} from "./useQueryParams";

function Demo() {
  const [isDebugging, setDebugger] = useState(true);
  const [currentQuery, setCurrentQuery] = useState("");

  const Vizwrapper = isDebugging ? Vizdebugger : Vizbuilder;

  const [query] = useQueryParams(currentQuery);
  console.log(query);
  const [result, error] = useQuery(query);

  return (
    <div style={{
      display: "flex",
      flexFlow: "column nowrap",
      height: "100%",
    }}>
      <QueryManager currentQuery={currentQuery} onChange={setCurrentQuery} />
      {result && <Vizwrapper
        queries={result}
        downloadFormats={["svg", "png"]}
        allowedChartTypes={["barchart", "barchartyear", "geomap", "lineplot", "stacked", "treemap"]}
      />}
    </div>
  );
}

ReactDOM.render(
  React.createElement(Demo),
  document.getElementById("app")
);
