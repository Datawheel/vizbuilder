import { ActionIcon, Badge, Flex, rem } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
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
    <Flex direction="column" w="100%" gap="sm" className="query-manager">
      <button onClick={createHandler}>New query</button>
      {queryPickers}
      <button onClick={clearHandler}>Clear</button>
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
    </Flex>
  );
};

function QueryPicker(props: {
  active: boolean;
  label: string;
  onEdit: () => void;
  onSelect: () => void;
}) {
  const removeButton = (
    <ActionIcon
      size="xs"
      color="blue"
      radius="xl"
      variant={props.active ? "filled" : "transparent"}
      onClick={props.onEdit}
    >
      <IconEdit size={rem(16)} />
    </ActionIcon>
  );

  return (
    <Badge
      variant={props.active ? "filled" : "outline"}
      size="lg"
      pr={3}
      rightSection={removeButton}
      onClick={props.onSelect}
    >
      {props.label}
    </Badge>
  )
}
