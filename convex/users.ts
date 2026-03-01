import { mutation, query } from "./_generated/server";
import { getViewerProfile, upsertViewerProfile } from "./lib/authProfile";

export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await upsertViewerProfile(ctx);
    return profile._id;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return getViewerProfile(ctx);
  },
});
