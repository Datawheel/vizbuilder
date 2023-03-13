import React, { useCallback, useMemo, useState } from "react";
import { QueryEditor } from "./QueryEditor";
import { useStoredState } from "./useStorage";

export const QueryManager = (props: {
  currentQuery: string;
  onChange: (nextQuery: string) => void;
}) => {
  const {currentQuery, onChange} = props;

  const [currentEdit, setCurrentEdit] = useState<null | string>(null);
  const [queries, setQueries] = useStoredState<string[]>("queries", []);

  const createHandler = useCallback(() => {
    const newKey = Math.random().toString(16).slice(2, 10);
    setQueries([...queries, newKey]);
    setCurrentEdit(newKey);
  }, [queries]);

  const clearHandler = useCallback(() => {
    setQueries([]);
  }, []);

  const closeHandler = useCallback(() => {
    if (!currentEdit) return;
    setCurrentEdit(null);
    onChange(currentEdit);
  }, [currentEdit, onChange]);

  const queryPickers = useMemo(() => queries.map(item =>
    <QueryPicker
      key={item}
      active={item === currentQuery}
      onSelect={() => onChange(item)}
      onEdit={() => setCurrentEdit(item)}
      label={item}
    />
  ), [currentQuery, queries]);

  return (
    <div className="query-manager">
      <div style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.5rem",
      }}>
        <button onClick={createHandler}>New query</button>
        <button onClick={clearHandler}>Clear</button>
        {queryPickers}
      </div>
      <dialog open={currentEdit != null}>
        <QueryEditor id={currentEdit || ""} onClose={closeHandler} />
      </dialog>
      <style>{`
dialog {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  margin: auto;
  box-shadow: 0 0 1em rgba(0, 0, 0, 0.4);
  border-width: 1px;
  border-radius: 3px;
}
dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(0.2);
}

dialog textarea {
  display: block;
  width: 50vw;
  height: 50vh;
  box-sizing: border-box;
}
`}</style>
    </div>
  );
};

function QueryPicker(props: {
  active: boolean;
  label: string;
  onEdit: () => void;
  onSelect: () => void;
}) {
  return (
    <span style={{
      display: "inline-flex",
      borderRadius: "4px",
      border: "1px solid rgb(227, 227, 227)",
    }}>
      <button onClick={props.onSelect} style={{
        borderRadius: 0,
        border: "0 none",
        opacity: props.active ? 1 : 0.7,
      }}>{props.label}</button>
      <button onClick={props.onEdit} style={{
        borderRadius: 0,
        border: "0 none",
        opacity: props.active ? 1 : 0.7,
      }}>&#x270E;</button>
    </span>
  )
}
