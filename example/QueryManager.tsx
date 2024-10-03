import {ActionIcon, Badge, Flex, Modal} from "@mantine/core";
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
              <IconEdit size="xs" />
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
      <Modal
        opened={currentEdit != null}
        onClose={closeHandler}
        title={`Edit query: ${currentEdit?.key}`}
      >
        {currentEdit && <QueryEditor query={currentEdit} onChange={updateQuery} />}
      </Modal>
    </Flex>
  );
}
