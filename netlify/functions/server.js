const serverless = require("serverless-http");
const { connectLambda } = require("@netlify/blobs");
const app = require("../../server");

const handler = serverless(app, { basePath: "/.netlify/functions/server" });

exports.handler = async (event, context) => {
  connectLambda(event);
  return handler(event, context);
};
