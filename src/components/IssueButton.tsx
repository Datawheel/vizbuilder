import {Button} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";
import React from "react";
import {useTranslation} from "../toolbox/translation";

export function IssueButton(props: {error: string; message?: string}) {
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
