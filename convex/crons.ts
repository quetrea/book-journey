import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup-expired-sessions",
  { hours: 24 },
  internal.sessions.cleanupExpiredSessions,
);

crons.interval(
  "cleanup-inactive-accounts",
  { hours: 24 },
  internal.users.cleanupInactiveAccounts,
);

export default crons;
