const convexDomain =
  process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

const authConfig = {
  providers: [
    {
      domain: convexDomain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
