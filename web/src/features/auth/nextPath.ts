/** Only same-origin paths are followed after sign-in, so a crafted ?next= cannot send users off-site. */
export function safeNextPath(rawNext: string | null, fallback = "/"): string {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) return fallback;
  return rawNext;
}
