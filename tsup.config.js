// @ts-check
import {defineConfig} from "tsup";

export default defineConfig(options => ({
  clean: !options.watch,
  entry: ["src/index.js"],
  format: ["cjs", "esm"],
  outExtension({format}) {
    return {js: `.${format}.js`};
  },
  shims: true,
  sourcemap: !!options.watch,
  splitting: false,
  treeshake: true
}));
