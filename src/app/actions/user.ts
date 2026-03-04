"use server";

import { createClient } from "@/lib/supabase/server";

export type UserRole = "FACULTY" | "STUDENT";

/**
 * Determines the role of the currently authenticated user.
 *
 * Strategy (fastest first):
 * 1. user_metadata.role — set at registration, requires no extra DB round-trip.
 * 2. Table row lookup — fallback for accounts whose metadata is missing or
 *    was set incorrectly (e.g. manually created accounts).
 *
 * Returns null if unauthenticated or role cannot be determined.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fast path: trust metadata set during registration
  const metaRole = user.user_metadata?.role as string | undefined;
  if (metaRole === "FACULTY") return "FACULTY";
  if (metaRole === "STUDENT") return "STUDENT";

  // 2. Fallback: search tables in case metadata is absent
  const { data: facultyRow } = await supabase
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (facultyRow) return "FACULTY";

  const { data: studentRow } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentRow) return "STUDENT";

  return null;
}

/**
 * Initiates an email address change for the currently authenticated user.
 * Supabase will send a confirmation email to the new address; the change
 * only takes effect once the user clicks the link.
 */
export async function updateEmail(
  newEmail: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) return { error: error.message };
  return { error: null };
}
