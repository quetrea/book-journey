export function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

/**
 * Returns relative time string: "just now", "5m ago", "2h ago".
 * Callers can prepend context like "Joined " or "Queued ".
 */
export function formatTimeAgo(ts: number) {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 60_000));
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}
