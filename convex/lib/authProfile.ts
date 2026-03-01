import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = MutationCtx | QueryCtx;

type Identity = NonNullable<
  Awaited<ReturnType<AuthCtx["auth"]["getUserIdentity"]>>
>;

function parseAuthUserId(subject: string): Id<"users"> {
  const [userId] = subject.split("|");

  if (!userId) {
    throw new Error("Invalid authentication subject.");
  }

  return userId as Id<"users">;
}

function providerFromTokenIdentifier(tokenIdentifier: string): string | undefined {
  const trimmed = tokenIdentifier.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes(":")) {
    return trimmed.split(":")[0]?.trim() || undefined;
  }

  if (trimmed.includes("|")) {
    return trimmed.split("|")[0]?.trim() || undefined;
  }

  return trimmed;
}

function nameFromIdentity(identity: Identity, fallback: string): string {
  if (typeof identity.name === "string" && identity.name.trim().length > 0) {
    return identity.name.trim();
  }

  return fallback;
}

function imageFromIdentity(identity: Identity, fallback: string | undefined): string | undefined {
  if (typeof identity.picture === "string" && identity.picture.trim().length > 0) {
    return identity.picture.trim();
  }

  return fallback;
}

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity;
}

export function getAuthUserIdFromIdentity(identity: Identity): Id<"users"> {
  return parseAuthUserId(identity.subject);
}

export async function getProfileByAuthUserId(
  ctx: AuthCtx,
  authUserId: Id<"users">,
) {
  return ctx.db
    .query("profiles")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .unique();
}

export async function getViewerProfile(ctx: AuthCtx) {
  const identity = await requireIdentity(ctx);
  const authUserId = getAuthUserIdFromIdentity(identity);

  return getProfileByAuthUserId(ctx, authUserId);
}

export async function upsertViewerProfile(ctx: MutationCtx): Promise<Doc<"profiles">> {
  const identity = await requireIdentity(ctx);
  const authUserId = getAuthUserIdFromIdentity(identity);
  const existing = await getProfileByAuthUserId(ctx, authUserId);
  const authUser = await ctx.db.get(authUserId);
  const fallbackName =
    authUser?.name?.trim() ||
    authUser?.email?.trim().split("@")[0] ||
    "Reader";
  const nextName = nameFromIdentity(identity, fallbackName);
  const nextImage = imageFromIdentity(identity, authUser?.image ?? undefined);
  const nextProvider = providerFromTokenIdentifier(identity.tokenIdentifier);
  const now = Date.now();

  if (existing) {
    const updates: Partial<
      Pick<Doc<"profiles">, "tokenIdentifier" | "provider" | "name" | "image" | "updatedAt">
    > = {};

    if (existing.tokenIdentifier !== identity.tokenIdentifier) {
      updates.tokenIdentifier = identity.tokenIdentifier;
    }

    if ((existing.provider ?? undefined) !== nextProvider) {
      updates.provider = nextProvider;
    }

    if (existing.name !== nextName) {
      updates.name = nextName;
    }

    if ((existing.image ?? undefined) !== nextImage) {
      updates.image = nextImage;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await ctx.db.patch(existing._id, updates);
    }

    const updated = await ctx.db.get(existing._id);

    if (!updated) {
      throw new Error("Failed to load viewer profile.");
    }

    return updated;
  }

  const profileId = await ctx.db.insert("profiles", {
    authUserId,
    tokenIdentifier: identity.tokenIdentifier,
    provider: nextProvider,
    name: nextName,
    image: nextImage,
    createdAt: now,
    updatedAt: now,
  });

  const profile = await ctx.db.get(profileId);

  if (!profile) {
    throw new Error("Failed to create viewer profile.");
  }

  return profile;
}
