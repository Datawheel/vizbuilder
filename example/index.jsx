import {TesseractDataSource, Client} from "@datawheel/olap-client";
import React, {useEffect, useState} from "react";
import ReactDOM from "react-dom";
import {Vizdebugger} from "../src/components/Vizdebugger";
import {Vizbuilder, buildQueryParams} from "../src";

const ds = new TesseractDataSource("/tesseract/");
const client = new Client(ds);

const Demo = () => {
  const [queries, setQueries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    client.getCube("thomasnet")
      .then(cube => {
        const query = cube.query
          .setFormat("jsonrecords")
          // .addDrilldown("Supplier Geography.Supplier Geography.Supplier State")
          // .addDrilldown("Supplier Contact.Supplier Contact.Supplier Contact")
          .addDrilldown("Conversion Action")
          .addDrilldown("Month")
          // .addMeasure("Viewed Supplier Product Content")
          // .addMeasure("Viewed Supplier Profile")
          // .addMeasure("Viewed Supplier Website")
          // .addMeasure("Supplier Contact")
          .addMeasure("Average Duration")
          .addMeasure("Total Duration");
        return client.execQuery(query).then(queryForVizbuilder);
      })
      .then(query => {
        setQueries([query]);
      }, err => {
        setError(`${err}`);
      });
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (queries.length === 0) {
    return (
      <dialog open={true}>
        <div>Loading...</div>
      </dialog>
    );
  }

  return (
    <div className="demo">
      <Vizbuilder
        queries={queries} 
        allowedChartTypes={["barchart", "geomap", "lineplot", "stacked", "treemap"]}
      />
    </div>
  );
};

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
      "Average Duration": secondFormatter,
      "Total Duration": secondFormatter,
      "Viewed Supplier Product Content": value => value ? "Yes" : "No",
      "Viewed Supplier Profile": value => value ? "Yes" : "No",
      "Viewed Supplier Website": value => value ? "Yes" : "No",
      "Supplier Contact": value => value ? "Yes" : "No"
    })
  };
}

ReactDOM.render(
  React.createElement(Demo), 
  document.getElementById("app")
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
