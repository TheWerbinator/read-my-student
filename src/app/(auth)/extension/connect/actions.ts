"use server";

import { adminDb } from "@/lib/admin";
import { issueExtensionToken } from "@/lib/extension-auth";
import { createClient } from "@/lib/supabase/server";

/** A new extension token for the signed-in professor. Null for anyone else. */
export async function connectExtension(): Promise<{ token: string; expiresAt: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminDb();
  const { data: faculty } = await db.from("faculty").select("id").eq("user_id", user.id).maybeSingle();
  if (!faculty) return null;
  return issueExtensionToken(db, user.id);
}
