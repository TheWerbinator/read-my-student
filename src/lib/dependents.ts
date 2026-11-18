// Faculty dependents (owner, 2026-11-11): a professor emails us, an admin
// invites the dependent, and the dependent's requests are free for 3 years.

import type { SupabaseClient } from "@supabase/supabase-js";

export const DEPENDENT_FREE_YEARS = 3;

/**
 * Starts a dependent's free period when a student with an unused invite for
 * their email loads the dashboard. The email must be confirmed, so nobody can
 * claim an invite with an address they do not own. The filtered update marks
 * the invite once, even if two tabs race. Returns the new free_requests_until,
 * or null when there is nothing to claim. shortcut: the invite and student
 * writes are not one transaction, so a failed second write loses the perk
 * until an admin sets free_requests_until by hand.
 */
export async function claimDependentInvite(
  db: SupabaseClient,
  studentId: string,
  user: { email?: string; email_confirmed_at?: string },
  now: Date,
): Promise<string | null> {
  if (!user.email || !user.email_confirmed_at) return null;
  const { data: invite, error } = await db
    .from("dependent_invites")
    .update({ student_id: studentId, used_at: now.toISOString() })
    .eq("email", user.email.toLowerCase())
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!invite) return null;

  const until = dependentFreeUntil(now);
  const { error: studentError } = await db
    .from("students")
    .update({ free_requests_until: until })
    .eq("id", studentId);
  if (studentError) throw studentError;
  return until;
}

/** The end of a dependent's free period that starts at `start`, as an ISO string. */
export function dependentFreeUntil(start: Date): string {
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + DEPENDENT_FREE_YEARS);
  return end.toISOString();
}
