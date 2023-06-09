import React from "react";
import {useTranslation} from "../toolbox/useTranslation";
import {Button} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";

/**
 * @typedef OwnProps
 * @property {string} error
 * @property {string | undefined} [message]
 */

/** @type {React.FC<OwnProps>} */
export const IssueButton = ({error, message}) => {
  const {translate: t} = useTranslation();
  const location = typeof window === "object" ? window.location : {};

  const body = `**URL**: ${location.href}
**Error**: ${error}
${message ? `**Error details:** ${message}\n` : ""}
**Detail of the issue:**
`;
  const issueParams = `title=${encodeURIComponent(`[report/vizbuilder] ${error}`)}&body=${encodeURIComponent(body)}`;

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
};
