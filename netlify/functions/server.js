const serverless = require("serverless-http");
const { connectLambda } = require("@netlify/blobs");
const app = require("../../server");

const handler = serverless(app, { basePath: "/.netlify/functions/server" });

exports.handler = async (event, context) => {
  const host = event.headers.host || "";
  process.env.IS_PRODUCTION = host.includes("--") ? "false" : "true";
  connectLambda(event);
  return handler(event, context);
};
