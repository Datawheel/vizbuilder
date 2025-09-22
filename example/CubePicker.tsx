import type {TesseractCube} from "@datawheel/logiclayer-client";
import {
  Button,
  Divider,
  getSize,
  type MantineSize,
  Modal,
  Paper,
  rem,
  SelectChevronIcon,
  SimpleGrid,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {IconCube} from "@tabler/icons-react";
import {groupBy} from "lodash-es";
import React, {Fragment, useMemo} from "react";
import {getAnnotation} from "../src/toolbox/tesseract";

const iconSizes = {
  xs: rem(14),
  sm: rem(18),
  md: rem(20),
  lg: rem(24),
  xl: rem(28),
};

export function CubePicker(props: {
  locale?: string;
  onChange: (value: string) => void;
  options: Record<string, TesseractCube>;
  selected?: string;
  size?: MantineSize;
}) {
  const {locale, onChange, options, selected, size = "sm"} = props;
  const [isOpen, actions] = useDisclosure(false);

  const iconSize = getSize({size, sizes: iconSizes});

  const cubeOptions = useMemo(() => {
    const cubeList = Object.values(options);
    const topics = groupBy(
      cubeList,
      cube =>
        `${getAnnotation(cube, "topic", locale)} > ${getAnnotation(cube, "subtopic", locale)} `,
    );
    return Object.entries(topics)
      .sort((a, b) => "".localeCompare.call(a[0], b[0], locale))
      .map(([topic, cubes]) => {
        return (
          <Fragment key={topic}>
            <Divider my="xs" label={topic} />
            <SimpleGrid
              mb="xl"
              breakpoints={[
                {minWidth: "96rem", cols: 4, spacing: "md"},
                {minWidth: "72rem", cols: 3, spacing: "sm"},
                {minWidth: "48rem", cols: 2, spacing: "sm"},
              ]}
            >
              {cubes.map(cube => {
                return (
                  <UnstyledButton
                    key={cube.name}
                    sx={{whiteSpace: "nowrap"}}
                    onClick={() => {
                      onChange(cube.name);
                      actions.close();
                    }}
                  >
                    <Paper
                      withBorder
                      p="sm"
                      sx={
                        selected === cube.name ? {backgroundColor: "#d0ebff"} : undefined
                      }
                    >
                      <Text truncate fw={700}>
                        {cube.name}
                      </Text>
                      <Text truncate size="xs">
                        {getAnnotation(cube, "table", locale)}
                      </Text>
                    </Paper>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          </Fragment>
        );
      });
  }, [actions.close, locale, onChange, options, selected]);

  return (
    <Fragment>
      <Modal size="100%" opened={isOpen} onClose={actions.close} title="Select cube">
        {cubeOptions}
      </Modal>
      <Button
        variant="default"
        size={size}
        uppercase
        leftIcon={<IconCube size={iconSize} />}
        rightIcon={<SelectChevronIcon size={size} error={!selected} />}
        onClick={actions.open}
        maw={300}
      >
        {selected || "<None>"}
      </Button>
    </Fragment>
  );
}
