/** Only ever redirect to a same-origin relative path. Anything else becomes /home. */
export function safeNext(next: unknown, fallback = "/home"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  try {
    const u = new URL(next, "http://local");
    if (u.origin !== "http://local") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
