/**
 * Sign-in tokens for the browser extension (plan Phase 5).
 * The connect page issues one to a signed-in professor. The extension sends it
 * as a Bearer token to /api/extension/*. Server-only: callers pass a secret-key client.
 */

import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hashToken } from "@/lib/request-access";

const TOKEN_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export async function issueExtensionToken(
  db: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + TOKEN_DAYS * DAY).toISOString();
  // Drop this user's expired tokens, so the table does not grow without a cron.
  await db.from("extension_tokens").delete().eq("user_id", userId).lt("expires_at", now.toISOString());
  const { error } = await db
    .from("extension_tokens")
    .insert({ token_hash: hashToken(token), user_id: userId, expires_at: expiresAt });
  if (error) throw new Error(error.message);
  return { token, expiresAt };
}

export function bearerToken(req: Request): string | null {
  const match = /^Bearer (\S+)$/.exec(req.headers.get("authorization") ?? "");
  return match ? match[1] : null;
}

/** The professor behind an unexpired token, or null. A user who is not a professor gets null. */
export async function extensionProfessor(
  db: SupabaseClient,
  token: string,
  now = new Date(),
): Promise<{ userId: string; facultyId: string } | null> {
  const { data: row, error } = await db
    .from("extension_tokens")
    .select("user_id")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", now.toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const userId = row.user_id as string;
  const { data: faculty, error: facultyError } = await db
    .from("faculty")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (facultyError) throw new Error(facultyError.message);
  return faculty ? { userId, facultyId: faculty.id as string } : null;
}

export async function revokeExtensionToken(db: SupabaseClient, token: string): Promise<void> {
  const { error } = await db.from("extension_tokens").delete().eq("token_hash", hashToken(token));
  if (error) throw new Error(error.message);
}
