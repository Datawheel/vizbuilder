import React from "react";
import {useTranslation} from "../toolbox/useTranslation";

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
`
  const issueParams = `title=${encodeURIComponent(`[report/vizbuilder] ${error}`)}&body=${encodeURIComponent(body)}`;

  return (
    <a
      className="bp3-button bp3-intent-primary"
      href={`https://github.com/Datawheel/vizbuilder/issues/new?${issueParams}`}
      rel="noopener noreferrer"
      role="button"
      tabIndex={0}
      target="_blank"
    >{t("action_fileissue")}</a>
  );
};
