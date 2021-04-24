import {Client, Format, TesseractDataSource} from "@datawheel/olap-client";
import forEach from "lodash/forEach";
import {useEffect, useState} from "react";
import {buildQueryParams} from "../src/index";

export const useQuery = () => {
  const [queries, setQueries] = useState([]);
  const [error, setError] = useState("");

  const [plainQuery, setPlainQuery] = useState(() => {
    const storedQuery = typeof window === "object" &&
      window.localStorage.getItem("vizbuilder-query");
    return storedQuery || "{}";
  });

  const setQuery = value => {
    typeof window === "object" &&
      window.localStorage.setItem("vizbuilder-query", value);
    setPlainQuery(value);
  };

  useEffect(() => {
    const q = JSON.parse(plainQuery);
    if (!q.cube) return;

    const ds = new TesseractDataSource("/tesseract/");
    const client = new Client(ds);

    client.getCube(q.cube)
      .then(cube => {
        const query = cube.query
          .fromJSON(q)
          .setFormat(Format.jsonrecords);

        return client.execQuery(query).then(queryForVizbuilder);
      })
      .then(query => {
        setQueries([query]);
      }, err => {
        setError(`${err}`);
      });
  }, [plainQuery]);

  return {result: queries, error, query: plainQuery, setQuery};
};

/**
 * @param {import("@datawheel/olap-client").Query} query
 * @param {any} json
 */
function fillQueryFromJSON(query, json) {
  if (json.cube && json.cube !== query.cube.name) {
    throw new Error(`Cube "${json.cube}" doesn't match with target Query object's cube "${query.cube.name}"`);
  }

  json.hasOwnProperty("cuts") &&
    forEach(json.cuts, (value, key) => query.addCut(key, value));

  json.hasOwnProperty("debug") &&
    query.setOption("debug", json.debug);

  json.hasOwnProperty("distinct") &&
    query.setOption("distinct", json.distinct);

  json.hasOwnProperty("drilldowns") &&
    forEach(json.drilldowns, item => query.addDrilldown(item));

  json.hasOwnProperty("format") &&
    query.setFormat(Format[json.format]);

  json.hasOwnProperty("limitAmount") &&
    query.setPagination(json.limitAmount, json.limitOffset);

  json.hasOwnProperty("locale") &&
    query.setLocale(json.locale);

  json.hasOwnProperty("measures") &&
    forEach(json.measures, item => query.addMeasure(item));

  json.hasOwnProperty("sortProperty") &&
    query.setSorting(json.sortProperty, json.sortDirection);

  json.hasOwnProperty("sparse") &&
    query.setOption("sparse", json.sparse);

  json.hasOwnProperty("timeValue") &&
    query.setTime(json.timeValue, json.timePrecision);

  return query;
}

/**
 * @param {import("@datawheel/olap-client").Aggregation<any[]>} aggregation
 * @returns {VizBldr.QueryResult}
 */
function queryForVizbuilder({data, query}) {
  const secondFormatter = value => {
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
