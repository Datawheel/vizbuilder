import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./example/",
  server: {
    proxy: {
      "/tesseract": {
        // auth: "username:password",
        target: "https://dev.sebrae.api.datawheel.us/tesseract/",
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/tesseract/, "")
      }
    }
  }
});
