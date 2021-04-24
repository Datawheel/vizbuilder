import React from "react";
import {useTranslation} from "../toolbox/useTranslation";
import {Button} from "./Button";

/**
 * @typedef DownloadButtonProps
 * @property {string[]} formats
 * @property {(format: string) => void} [onClick]
 */

/** @type {React.FC<DownloadButtonProps>} */
export const DownloadButton = props => {
  const {onClick} = props;

  const {translate} = useTranslation();

  return (
    <span className="bp3-button-group">
      {props.formats.map((format, i) => {
        const formatCaps = format.toUpperCase();
        const evtHandler = onClick ? () => onClick(formatCaps) : null;
        const text = i === 0
          ? translate("action_download", {format: formatCaps})
          : formatCaps;
        return <Button key={format} onClick={evtHandler} text={text} />;
      })}
    </span>
  );
}
