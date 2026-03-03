"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const vapidSubject = process.env.VAPID_SUBJECT;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
  console.error("[push] VAPID env vars missing:", {
    VAPID_SUBJECT: !!vapidSubject,
    VAPID_PUBLIC_KEY: !!vapidPublicKey,
    VAPID_PRIVATE_KEY: !!vapidPrivateKey,
  });
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export const sendTurnNotification = internalAction({
  args: {
    userId: v.id("profiles"),
    bookTitle: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error("[push] Aborting: VAPID env vars not set.");
      return;
    }
    console.log("[push] sendTurnNotification userId:", args.userId, "book:", args.bookTitle);

    const subscriptions = await ctx.runQuery(
      internal.pushSubscriptions.getSubscriptionsForUser,
      { userId: args.userId },
    );

    console.log("[push] subscriptions found:", subscriptions.length);

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: "Your turn to read!",
      body: `It's your turn in "${args.bookTitle}"`,
      url: `/s/${args.sessionId}`,
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload,
          );
          console.log("[push] sent OK to:", sub.endpoint.slice(0, 50));
        } catch (error: unknown) {
          const status = (error as { statusCode?: number })?.statusCode;
          console.error("[push] send failed — status:", status, "error:", String(error));
          if (status === 410 || status === 404) {
            await ctx.runMutation(
              internal.pushSubscriptions.removeStaleSubscription,
              { endpoint: sub.endpoint },
            );
          }
        }
      }),
    );
  },
});
