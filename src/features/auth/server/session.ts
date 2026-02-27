import { getServerSession } from "next-auth";

import { authOptions } from "./authOptions";

export function getAppSession() {
  return getServerSession(authOptions);
}
