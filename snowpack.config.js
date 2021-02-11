const httpProxy = require("http-proxy");
const proxy = httpProxy.createServer({
  auth: "username:password",
  target: "http://olap-server.url"
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
    dest: (req, res) => proxy.web(req, res)
  }],
  devOptions: {
    open: "none"
  }
};
