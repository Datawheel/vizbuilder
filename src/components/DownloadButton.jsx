import React from "react";
import {Button} from "@mantine/core";
import {IconDownload, IconVectorTriangle, IconPhotoDown} from "@tabler/icons-react";

const iconByFormat = {
  JPG: IconPhotoDown,
  PNG: IconPhotoDown,
  SVG: IconVectorTriangle
};

/**
 * @typedef DownloadButtonProps
 * @property {string[]} formats
 * @property {(format: string) => void} [onClick]
 */

/** @type {React.FC<DownloadButtonProps>} */
export const DownloadButton = props => {
  const {onClick} = props;

  return (
    <>
      {props.formats.map(format => {
        const formatCaps = format.toUpperCase();
        const evtHandler = onClick ? () => onClick(formatCaps) : null;
        const Icon = iconByFormat[formatCaps] || IconDownload;
        return (
          <Button
            compact
            key={format}
            leftIcon={<Icon size={16} />}
            onClick={evtHandler}
            size="sm"
            variant="light"
          >
            {formatCaps}
          </Button>
        );
      })}
    </>
  );
};
