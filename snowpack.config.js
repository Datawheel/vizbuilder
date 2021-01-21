const httpProxy = require("http-proxy");
const proxy = httpProxy.createServer({
  auth: "workspace:work_in_progress",
  target: "http://explorer.dev.thomasnet.com"
});

/** @type {import("snowpack").SnowpackUserConfig} */
module.exports = {
  mount: {
    example: "/",
    src: "/src"
  },
  plugins: ["@snowpack/plugin-react-refresh"],
  routes: [{
    match: "all",
    src: "/tesseract.*",
    dest: (req, res) => proxy.web(req, res),
  }],
  devOptions: {
    open: "none"
  }
};
