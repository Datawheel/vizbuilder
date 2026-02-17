import type {TesseractCube} from "@datawheel/logiclayer-client";
import {
  Box,
  CloseButton,
  Divider,
  Modal,
  Paper,
  rem,
  SimpleGrid,
  Text,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {IconSearch} from "@tabler/icons-react";
import {groupBy} from "lodash-es";
import React, {useMemo, useState} from "react";
import {getAnnotation} from "../src/toolbox/tesseract";

const rtlLanguages = ["ar", "he", "fa", "ur", "yi", "dv"];

export function FullscreenSearch(props: {
  list: TesseractCube[];
  locale: string;
  children?: React.ReactNode;
  onSelect?: (item: TesseractCube) => void;
}) {
  const {list, locale, children: trigger, onSelect} = props;

  const [opened, {open, close}] = useDisclosure(false);
  const [search, setSearch] = useState("");
  const theme = useMantineTheme();

  const groupedResults = useMemo(() => {
    const query = new RegExp(search.trim().replace(" ", ".+"), "i");
    // Show all if query is empty, or filter by query
    const filtered = query
      ? list.filter(
          item =>
            query.test(item.name) ||
            query.test(getAnnotation(item, "table", locale) || item.caption),
        )
      : list;
    return groupBy(
      filtered,
      cube =>
        `${getAnnotation(cube, "topic", locale)} > ${getAnnotation(cube, "subtopic", locale)} `,
    );
  }, [list, search, locale]);

  const categories = Object.keys(groupedResults).sort();

  return (
    <>
      <Box onClick={open} sx={{display: "inline-block"}}>
        {trigger || (
          <UnstyledButton
            sx={{
              display: "flex",
              alignItems: "center",
              padding: theme.spacing.xs,
              paddingLeft: theme.spacing.md,
              paddingRight: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[1],
              color:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[0]
                  : theme.colors.gray[6],
              width: "100%",
              minWidth: 200,
              transition: "background-color 0.2s",
              "&:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[2],
              },
            }}
          >
            <IconSearch size="1rem" style={{marginRight: theme.spacing.xs}} />
            <Text size="sm">Search...</Text>
          </UnstyledButton>
        )}
      </Box>

      <Modal
        opened={opened}
        onClose={close}
        fullScreen
        transitionProps={{transition: "fade", duration: 200}}
        padding={0}
        withCloseButton={false}
        zIndex={200}
        styles={{
          body: {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            backgroundColor:
              theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[0],
          },
        }}
      >
        {/* Header with Search Input */}
        <Box
          sx={{
            padding: theme.spacing.md,
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
            backgroundColor:
              theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
            borderBottom: `${rem(1)} solid ${
              theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.md,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: theme.spacing.md,
            }}
          >
            <IconSearch
              size="2rem"
              color={
                theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[4]
              }
            />
            <TextInput
              placeholder="What are you looking for?"
              value={search}
              onChange={e => setSearch(e.currentTarget.value)}
              variant="unstyled"
              size="xl"
              sx={{flex: 1}}
              styles={{
                input: {
                  fontSize: rem(32),
                  fontWeight: 300,
                  color:
                    theme.colorScheme === "dark" ? theme.white : theme.colors.dark[9],
                  "&::placeholder": {
                    color:
                      theme.colorScheme === "dark"
                        ? theme.colors.dark[3]
                        : theme.colors.gray[4],
                  },
                },
              }}
              autoFocus
            />
            <CloseButton size="xl" onClick={close} iconSize={32} />
          </Box>
        </Box>

        {/* Results Area */}
        <Box
          lang={locale}
          dir={rtlLanguages.includes(locale) ? "rtl" : "undefined"}
          sx={{
            flex: 1,
            overflowY: "auto",
            padding: theme.spacing.xl,
          }}
        >
          <Box sx={{maxWidth: 1200, margin: "0 auto", paddingBottom: 100}}>
            {categories.length === 0 ? (
              <Text color="dimmed" align="center" mt="xl" size="xl">
                No results found for "{search}"
              </Text>
            ) : (
              categories.map(category => (
                <Box key={category} mb={rem(48)}>
                  <Divider
                    label={category}
                    styles={{
                      label: {
                        marginBottom: rem(12),
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        fontSize: rem(14),
                        fontWeight: 700,
                        color: theme.colors.gray[6],
                      },
                    }}
                  />

                  <SimpleGrid
                    cols={4}
                    breakpoints={[
                      {maxWidth: "md", cols: 3},
                      {maxWidth: "sm", cols: 2},
                      {maxWidth: "xs", cols: 1},
                    ]}
                    spacing="md"
                  >
                    {groupedResults[category].map(item => (
                      <UnstyledButton
                        key={item.name}
                        onClick={() => {
                          onSelect?.(item);
                          close();
                        }}
                        sx={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: theme.shadows.md,
                            "& .mantine-Paper-root": {
                              borderColor: theme.colors.blue[5],
                            },
                          },
                        }}
                      >
                        <Paper
                          withBorder
                          title={item.name}
                          px="md"
                          py="xs"
                          sx={{
                            height: "100%",
                            backgroundColor:
                              theme.colorScheme === "dark"
                                ? theme.colors.dark[7]
                                : theme.white,
                            transition: "border-color 0.2s ease",
                          }}
                        >
                          <Text size="lg" lineClamp={2} lh={1.1} mb={4}>
                            {getAnnotation(item, "table", locale) || item.caption}
                          </Text>
                          <Text size="xs" color="dimmed" lineClamp={2}>
                            {item.name}
                          </Text>
                        </Paper>
                      </UnstyledButton>
                    ))}
                  </SimpleGrid>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
}
