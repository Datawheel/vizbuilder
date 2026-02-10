import react from "@vitejs/plugin-react";
import {defineConfig} from "vitest/config";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

/**
 * Replace the target URL of the backend server in this file
 * to make vite proxy the requests and avoid CORS issues.
 */
const url = new URL("https://datasaudi-pytesseract-feb.datawheel.us/tesseract/");
// const url = new URL("https://api-ts-dev.datausa.io/tesseract/");
const headers = {};

// ensure the target URL ends with a trailing slash
url.pathname = `${url.pathname}/`.replace(/\/{2,}/g, "/");

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ["**/*.test.ts", "**/*.test.tsx", "src/setupTests.ts", "example/**"],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/react/index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "esm" : "cjs"}.js`,
    },
    rollupOptions: {
      external: [
        // dependencies
        "@datawheel/logiclayer-client",
        "@datawheel/use-translation",
        "@mantine/core",
        "@tabler/icons-react",
        "d3plus-common",
        "d3plus-format",
        "lodash-es",
        // peerDependencies
        "clsx",
        "d3plus-export",
        "d3plus-react",
        "react",
        "react-dom",
        "react-inspector",
        // built-ins
        "react/jsx-runtime",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: mode === "development",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"]
  },
  server: {
    proxy: {
      "/tesseract/": {
        // auth: "username:password",
        changeOrigin: true,
        followRedirects: true,
        headers,
        rewrite: path => path.replace(/^\/tesseract\//, url.pathname),
        secure: false,
        target: url.origin
      }
    }
  }
}));
