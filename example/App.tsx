import { useNetwork } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconExclamationCircle, IconPlugConnectedX } from "@tabler/icons-react";
import { keyBy } from "lodash-es";
import React, { useState } from "react";
import type { GeomapConfig } from "../src/d3plus";
import { Vizbuilder, VizbuilderProvider, Vizdebugger } from "../src/react";
import { useFormatter } from "./FormatterProvider";
import { useQueries } from "./QueriesProvider";
import { useTesseractData } from "./TesseractProvider";
import { Toolbar } from "./Toolbar";

import "./index.css";

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

export function App() {
  const networkStatus = useNetwork();

  const [mode, setMode] = useState("Vizdebugger");

  const {currentQuery} = useQueries();

  const {dataset, isLoading, error} = useTesseractData(currentQuery);

  const {getFormatter} = useFormatter();

  React.useEffect(() => {
    if (error) {
      showNotification({
        title: "Tesseract Error",
        message: error,
        color: "red",
        icon: <IconExclamationCircle />,
        autoClose: false,
      });
    }
  }, [error]);

  const prevOnline = React.useRef(networkStatus.online);
  React.useEffect(() => {
    if (!networkStatus.online) {
      showNotification({
        id: "network-status",
        title: "Network Disconnected",
        message: "You are currently offline. Some features may not work properly.",
        color: "yellow",
        icon: <IconPlugConnectedX />,
        autoClose: false,
      });
    } else if (!prevOnline.current && networkStatus.online) {
      showNotification({
        id: "network-status",
        title: "Network Restored",
        message: "You are back online.",
        color: "green",
        autoClose: 3000,
      });
    }
    prevOnline.current = networkStatus.online;
  }, [networkStatus.online]);

  const Vizwrapper = mode === "Vizbuilder" ? Vizbuilder : Vizdebugger;

  return (
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
      <div
        style={{
          height: "100%",
          padding: "0.5rem",
          backgroundColor: "#f0f0f0",
          display: "flex",
          flexFlow: "column nowrap",
          gap: "0.5rem",
        }}
      >
        <Toolbar mode={mode} setMode={setMode} loading={isLoading} />
        <Vizwrapper
          datasets={dataset || []}
          style={{
            flex: "1 0 0",
            height: "100%",
            boxSizing: "border-box",
            overflow: "auto",
          }}
        />
      </div>
    </VizbuilderProvider>
  );
}
