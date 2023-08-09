import { Format } from "@datawheel/olap-client";
import { useEffect, useState } from "react";
import { buildQueryParams } from "../src/index";
import { client } from "./useOlapSchema";
import { QueryParams } from "./useQueryParams";

export function useQuery(query: QueryParams) {
  const [result, setResult] = useState<VizBldr.QueryResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(null);

    client.getCube(query.cube)
      .then(cube => {
        const q = cube.query.setFormat(Format.jsonrecords);
        q.setLocale("ar");
        query.measures.forEach(measure => {
          q.addMeasure(measure);
        });
        query.drilldowns.forEach(level => {
          q.addDrilldown(level);
        });
        return client.execQuery(q, "logiclayer").then(queryForVizbuilder);
      })
      .then(result => {
        console.log(result);
        setResult(result);
      }, err => {
        setError(`${err.stack || err}`);
      });
  }, [query]);

  return [result, error, query] as const;
}

function queryForVizbuilder(
  {data, query}: OlapClient.Aggregation<any[]>,
): VizBldr.QueryResult {
  return {
    cube: query.cube.toJSON(),
    dataset: data,
    params: buildQueryParams(query, {
      // "Viewed Supplier Product Content": value => value ? "Yes" : "No",
      // "Viewed Supplier Profile": value => value ? "Yes" : "No",
      // "Viewed Supplier Website": value => value ? "Yes" : "No",
      // "Supplier Contact": value => value ? "Yes" : "No",
      "Average Duration": secondFormatter,
      "Total Duration": secondFormatter
    })
  };
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
    `${Math.floor(secs) !== secs ? secs.toFixed(3) : secs}s`
  ].filter(Boolean).join("");
};
