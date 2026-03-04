"use server";

import { createClient } from "@/lib/supabase/server";
import {
  profileFormToDbRow,
  type FacultyProfileRow,
  type RecommenderForm,
} from "@/lib/faculty-profile";

const PROFILE_COLUMNS = [
  "id",
  "user_id",
  "institution",
  "institution_opeid",
  "department",
  "title",
  "country",
  "state",
  "city",
  "postal_code",
  "street",
  "prefix",
  "first_name",
  "last_name",
  "phone",
  "email",
  "signature_storage_path",
  "logo_storage_path",
].join(", ");

/**
 * Fetch the faculty profile row for the currently authenticated user.
 * Returns null if the user is not logged in or has no faculty row.
 */
export async function getFacultyProfile(): Promise<FacultyProfileRow | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("faculty")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return data as unknown as FacultyProfileRow;
}

/**
 * Persist the recommender form fields back to the faculty row.
 * Uses the regular server client so RLS applies (faculty can only
 * update their own row).
 */
export async function saveFacultyProfile(
  form: RecommenderForm,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const updates = {
    ...profileFormToDbRow(form),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("faculty")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Upload a logo or signature image to the faculty-assets Storage bucket,
 * then persist the storage path on the faculty row.
 * Returns a 1-hour signed URL so the client can display the image immediately.
 *
 * Bucket setup required in Supabase:
 *   - Bucket name: faculty-assets  (private, not public)
 *   - RLS: allow auth users to SELECT/INSERT/UPDATE their own folder ({user.id}/*)
 */
export async function uploadFacultyAsset(
  formData: FormData,
  assetType: "logo" | "signature",
): Promise<{
  success: boolean;
  storagePath?: string;
  signedUrl?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${user.id}/${assetType}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("faculty-assets")
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (uploadError) return { success: false, error: uploadError.message };

  // Persist path to the faculty profile row
  const column =
    assetType === "logo" ? "logo_storage_path" : "signature_storage_path";
  await supabase
    .from("faculty")
    .update({ [column]: storagePath, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  // Short-lived signed URL so the component can render the image immediately
  const { data: signedData } = await supabase.storage
    .from("faculty-assets")
    .createSignedUrl(storagePath, 3600);

  return { success: true, storagePath, signedUrl: signedData?.signedUrl };
}
