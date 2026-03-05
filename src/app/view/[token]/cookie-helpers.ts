/**
 * Shared cookie helpers for the /view/[token] email-verification gate.
 * Pure synchronous functions — safe to import in both server components and
 * server actions without needing "use server".
 */

import { createHmac } from "crypto";

export function viewCookieName(tokenHash: string): string {
  // Short prefix keeps storage tidy; 12 hex chars is plenty to stay unique
  return `rms-view-${tokenHash.slice(0, 12)}`;
}

export function viewCookieValue(tokenHash: string): string {
  const secret = process.env.PDF_SIGNING_SECRET!;
  return createHmac("sha256", secret).update(tokenHash).digest("hex");
}
