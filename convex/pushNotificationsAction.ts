"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export const sendTurnNotification = internalAction({
  args: {
    userId: v.id("profiles"),
    bookTitle: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.runQuery(
      internal.pushSubscriptions.getSubscriptionsForUser,
      { userId: args.userId },
    );

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: "Your turn to read!",
      body: `It's your turn in "${args.bookTitle}"`,
      url: `/sessions/${args.sessionId}`,
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
        } catch (error: unknown) {
          const status = (error as { statusCode?: number })?.statusCode;
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
