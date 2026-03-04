import { httpRouter } from "convex/server";

import { auth } from "./auth";
import { discordWebhook } from "./discordWebhook";

const http = httpRouter();

auth.addHttpRoutes(http);
http.route({
  path: "/webhooks/discord",
  method: "POST",
  handler: discordWebhook,
});

export default http;
