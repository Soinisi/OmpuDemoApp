const serverless = require("serverless-http");
const { connectLambda } = require("@netlify/blobs");
const app = require("../../server");

const handler = serverless(app, { basePath: "/.netlify/functions/server" });

exports.handler = async (event, context) => {
  const host = event.headers.host || "";
  process.env.IS_PRODUCTION = host.includes("--") ? "false" : "true";

  if (event.blobs) {
    try {
      const data = JSON.parse(Buffer.from(event.blobs, "base64").toString());
      if (data.region) process.env.BLOBS_REGION = data.region;
    } catch {}
  }
  if (!process.env.BLOBS_REGION && process.env.AWS_REGION) {
    process.env.BLOBS_REGION = process.env.AWS_REGION;
  }

  if (event.headers["x-nf-deploy-id"]) {
    process.env.DEPLOY_ID = event.headers["x-nf-deploy-id"].slice(0, 8);
  }

  connectLambda(event);
  return handler(event, context);
};
