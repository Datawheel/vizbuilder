import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

/**
 * Replace the target URL of the backend server in this file
 * to make vite proxy the requests and avoid CORS issues.
 */
const url = new URL("https://api.datasaudi.datawheel.us/tesseract/");
// const url = new URL("https://api-ts-dev.datausa.io/tesseract/");
const headers = {};

// ensure the target URL ends with a trailing slash
url.pathname = `${url.pathname}/`.replace(/\/{2,}/g, "/");

export default defineConfig({
  plugins: [react()],
  root: "./example/",
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
});
