import React, {useState} from "react";
import ReactDOM from "react-dom";
import {Vizdebugger} from "../src/components/Vizdebugger";
import {Vizbuilder} from "../src/index";
import {useQuery} from "./useQuery";

const Demo = () => {
  const [isDebugging, setDebugger] = useState(true);
  const [dialogState, setDialogState] = useState(false);
  const {error, result, query, setQuery} = useQuery();

  if (error) {
    return <div>{error}</div>;
  }

  if (result.length === 0) {
    return (
      <dialog open={true}>
        <div>Loading...</div>
      </dialog>
    );
  }

  const Vizwrapper = isDebugging ? Vizdebugger : Vizbuilder;

  return (
    <div className="demo">
      <Vizwrapper
        queries={result}
        downloadFormats={["svg", "png"]}
        allowedChartTypes={["barchart", "barchartyear", "geomap", "lineplot", "stacked", "treemap"]}
        toolbar={
          <React.Fragment>
            <button type="button" onClick={() => setDialogState(true)}>Edit query</button>
            <dialog open={dialogState}>
              <form method="dialog" onSubmit={({target: form}) => {
                setQuery(form.plainQuery.value);
                setDialogState(false);
              }}>
                <textarea name="plainQuery" defaultValue={query} />
                <button type="submit">Cerrar</button>
              </form>
            </dialog>
            <button onClick={() => setDebugger(!isDebugging)}>
              {isDebugging ? "Change to Vizbuilder" : "Change to Vizdebugger"}
            </button>
          </React.Fragment>
        }
      />
    </div>
  );
};

ReactDOM.render(
  React.createElement(Demo),
  document.getElementById("app")
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
