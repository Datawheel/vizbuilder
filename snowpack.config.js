/** @type {import("snowpack").SnowpackConfig} */
module.exports = {
  mount: {
    example: "/",
    src: "/src/"
  },
  plugins: ["@snowpack/plugin-react-refresh"],
  proxy: {
    "/tesseract": {
    }
  }
};
