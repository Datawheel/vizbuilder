import {Button, Flex, Group, Text, Title} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";
import React, {Component} from "react";
import {TranslationConsumer, useTranslation} from "./TranslationProvider";

interface Props {
  children: React.ReactNode;
}

interface State {
  message: string;
  name: string;
}

export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return {message: error.message, name: error.name};
  }

  state: State = {
    message: "",
    name: "",
  };

  clearError = () => this.setState({message: "", name: ""});

  render() {
    const {message, name} = this.state;

    if (!message) {
      return this.props.children;
    }

    return (
      <TranslationConsumer>
        {({translate: t}) => {
          const detailText = t("error.detail");

          return (
            <Flex
              p="xl"
              align="center"
              justify="center"
              direction="column"
              className="chart-card error"
            >
              <Title order={3}>{t("error.title")}</Title>
              {detailText.length ? <Text>{detailText}</Text> : null}
              <Text>{t("error.message", {message})}</Text>
              <Group spacing="xs" my="sm">
                <Button onClick={this.clearError} size="xs" variant="light">
                  {t("action_retry")}
                </Button>
                <IssueButton error={name} message={message} />
              </Group>
            </Flex>
          );
        }}
      </TranslationConsumer>
    );
  }
}

function IssueButton(props: {error: string; message?: string}) {
  const {error, message} = props;

  const {translate: t} = useTranslation();
  const location = typeof window === "object" ? window.location : {href: "<SSR>"};

  const issueParams = new URLSearchParams({
    title: `[report/vizbuilder] ${error}`,
    body: [
      `**URL**: ${location.href}`,
      `**Error**: ${error}`,
      message ? `**Error details:** ${message}\n` : "",
      "**Detail of the issue:**\n",
    ].join("\n"),
  });

  return (
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
  );
}
