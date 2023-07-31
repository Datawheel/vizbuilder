import React, {useState} from "react";
import ReactDOM from "react-dom";
import {Vizdebugger} from "../src/components/Vizdebugger";
import {Vizbuilder} from "../src/index";
import {QueryManager} from "./QueryManager";
import {useQuery} from "./useQuery";
import {useQueryParams} from "./useQueryParams";
import {useDisclosure} from "@mantine/hooks";
import {Button, Flex} from "@mantine/core";

function Demo() {
  const [isDebugging, setDebugger] = useDisclosure(true);
  const [currentQuery, setCurrentQuery] = useState("");

  const Vizwrapper = isDebugging ? Vizdebugger : Vizbuilder;

  const [query] = useQueryParams(currentQuery);
  console.log(query);
  const [result, error] = useQuery(query);

  return (
    <Flex direction="column">
      <Flex gap="sm" align="center" px="sm">
        <Button compact uppercase color="indigo" onClick={setDebugger.toggle}>
          {Vizwrapper.name}
        </Button>
        <QueryManager currentQuery={currentQuery} onChange={setCurrentQuery} />
      </Flex>
      {result && <Vizwrapper
        queries={result}
        downloadFormats={["svg", "png"]}
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
      />}
    </Flex>
  );
}

ReactDOM.render(
  React.createElement(Demo),
  document.getElementById("app")
);
