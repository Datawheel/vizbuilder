import {ActionIcon, Badge, Flex, rem} from "@mantine/core";
import {IconEdit} from "@tabler/icons-react";
import React, {useCallback, useMemo, useState} from "react";
import type {QueryParams} from "../src/structs";
import {useQueries} from "./QueriesProvider";
import {QueryEditor} from "./QueryEditor";

export function QueryManager(props: {}) {
  const {currentQuery, createQuery, queries, setCurrentQuery, clearQueries, updateQuery} =
    useQueries();

  const [currentEdit, setCurrentEdit] = useState<QueryParams | null>(null);

  const closeHandler = useCallback(() => {
    if (currentEdit) {
      setCurrentQuery(currentEdit.key);
      setCurrentEdit(null);
    }
  }, [currentEdit, setCurrentQuery]);

  const queryPickers = useMemo(
    () =>
      queries.map(item => (
        <Badge
          key={item.key}
          variant={item === currentQuery ? "filled" : "outline"}
          size="lg"
          pr={3}
          rightSection={
            <ActionIcon
              size="xs"
              color="blue"
              radius="xl"
              variant={item === currentQuery ? "filled" : "transparent"}
              onClick={() => setCurrentEdit(item)}
            >
              <IconEdit size={rem(16)} />
            </ActionIcon>
          }
          onClick={() => setCurrentQuery(item.key)}
        >
          {item.key}
        </Badge>
      )),
    [currentQuery, queries, setCurrentQuery],
  );

  return (
    <Flex direction="row" w="100%" gap="sm" className="query-manager">
      <button type="button" onClick={createQuery}>
        New query
      </button>
      {queryPickers}
      <button type="button" onClick={clearQueries}>
        Clear
      </button>
      <dialog open={currentEdit != null}>
        {currentEdit && (
          <QueryEditor
            query={currentEdit}
            onChange={updateQuery}
            onClose={closeHandler}
          />
        )}
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
}
