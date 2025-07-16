import {Center, Flex, Loader, Text, Title} from "@mantine/core";
import {IconCircleOff} from "@tabler/icons-react";
import React, {useMemo} from "react";
import {useVizbuilderContext} from "./VizbuilderProvider";

export function NonIdealState(props: {status: "loading" | "empty" | "one-row"}) {
  const {status} = props;

  const {translate: t} = useVizbuilderContext();

  const description = useMemo(() => {
    if (status === "loading") {
      return (
        <Flex justify="center" align="center" direction="column">
          <Loader size="xl" />
          <Title mt="md" order={4}>
            {t("transient.title_loading")}
          </Title>
        </Flex>
      );
    }

    if (status === "one-row") {
      return (
        <Flex justify="center" align="center" direction="column" w="50%">
          <IconCircleOff size={92} />
          <Title mt="md" mb="md" order={4}>
            {t("transient.title_one_row")}
          </Title>
        </Flex>
      );
    }

    return (
      <Flex justify="center" align="center" direction="column" w="50%">
        <IconCircleOff size={92} />
        <Title mt="md" mb="md" order={4}>
          {t("transient.title_empty")}
        </Title>
        <Text>{t("transient.description_empty")}</Text>
      </Flex>
    );
  }, [status, t]);

  return <Center h="100%">{description}</Center>;
}
