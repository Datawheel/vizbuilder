import {ActionIcon, Badge, Button, Flex, Modal} from "@mantine/core";
import {IconEdit} from "@tabler/icons-react";
import React, {useCallback, useMemo, useState} from "react";
import {useQueries} from "./QueriesProvider";
import {QueryEditor} from "./QueryEditor";

export function QueryManager() {
  const {currentQuery, createQuery, queries, setCurrentQuery, clearQueries, updateQuery} =
    useQueries();

  const [editIndex, setEditIndex] = useState<number>(-1);

  const closeHandler = useCallback(() => {
    const currentEdit = editIndex > -1 ? queries[editIndex] : undefined;
    if (currentEdit) {
      setEditIndex(-1);
      setCurrentQuery(currentEdit.key);
    }
  }, [editIndex, queries, setCurrentQuery]);

  const queryPickers = useMemo(
    () =>
      queries.map((item, index) => (
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
              onClick={() => setEditIndex(index)}
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
    <Flex style={{flex: "1 0"}} direction="row" gap="sm">
      <Button compact variant="outline" onClick={createQuery}>
        New query
      </Button>
      {queryPickers}
      <Button compact variant="outline" onClick={clearQueries}>
        Clear
      </Button>
      <Modal
        opened={editIndex > -1}
        onClose={closeHandler}
        title={`Edit query: ${editIndex > -1 ? queries[editIndex].key : undefined}`}
      >
        {editIndex > -1 && (
          <QueryEditor params={queries[editIndex]} onChange={updateQuery} />
        )}
      </Modal>
    </Flex>
  );
}
