import {Button, Flex, Group, Paper, Text, Title} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";
import type {ErrorContentProps} from "./ErrorBoundary";
import {useVizbuilderContext} from "./VizbuilderProvider";

export function ReportIssueCard(props: ErrorContentProps) {
  const {errorMessage, errorClass, onClear: clearHandler} = props;

  const {translate: t} = useVizbuilderContext();

  const detailText = t("error.detail");

  const location = typeof window === "object" ? window.location : {href: "<SSR>"};

  const issueParams = new URLSearchParams({
    title: `[report/vizbuilder] ${errorClass}`,
    body: [
      `**URL**: ${location.href}`,
      `**Error**: ${errorClass}`,
      errorMessage ? `**Error details:** ${errorMessage}\n` : "",
      "**Detail of the issue:**\n",
    ].join("\n"),
  });

  return (
    <Paper w="100%">
      <Flex
        p="xl"
        align="center"
        justify="center"
        direction="column"
        className="chart-card error"
      >
        <Title order={3}>{t("error.title")}</Title>
        {detailText.length ? <Text>{detailText}</Text> : null}
        <Text>{t("error.message", {message: errorMessage})}</Text>
        <Group spacing="xs" my="sm">
          <Button onClick={clearHandler} size="xs" variant="light">
            {t("action_retry")}
          </Button>
          {/** biome-ignore lint/a11y/useSemanticElements: biome can't recognize the component */}
          <Button
            component="a"
            href={`https://github.com/Datawheel/vizbuilder/issues/new?${issueParams}`}
            leftIcon={<IconBrandGithub size="1rem" />}
            rel="noopener noreferrer"
            role="button"
            size="xs"
            tabIndex={0}
            target="_blank"
            variant="subtle"
          >
            {t("action_fileissue")}
          </Button>
        </Group>
      </Flex>
    </Paper>
  );
}
