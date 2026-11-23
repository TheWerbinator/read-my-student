/**
 * A professor's open requests and sealed letters, by faculty id. Used by the
 * dashboard actions and the extension API. Server-only: the caller passes a
 * secret-key client and has already checked which professor is asking.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type FacultyLetterRequest = {
  requestId: string;
  studentName: string;
  courseContext: string | null;
  studentNote: string | null;
  createdAt: string;
};

export type FacultyFinalizedLetter = {
  letterId: string;
  studentName: string;
  finalizedAt: string;
  studentPreviewEnabled: boolean;
};

// Names live in auth user_metadata.
async function studentName(db: SupabaseClient, studentId: string): Promise<string> {
  const { data: studentRow } = await db
    .from("students")
    .select("user_id")
    .eq("id", studentId)
    .maybeSingle();

  let name = "Unknown Student";
  if (studentRow?.user_id) {
    const { data: authUser } = await db.auth.admin.getUserById(studentRow.user_id as string);
    if (authUser?.user) {
      const meta = authUser.user.user_metadata ?? {};
      name =
        [meta.firstName, meta.lastName].filter(Boolean).join(" ") ||
        authUser.user.email ||
        "Unknown Student";
    }
  }
  return name;
}

/** Requests that still need a letter (status = 'requested'), newest first. */
export async function listFacultyRequests(
  db: SupabaseClient,
  facultyId: string,
): Promise<FacultyLetterRequest[]> {
  const { data, error } = await db
    .from("letter_requests")
    .select("id, student_id, course_context, student_note, created_at")
    .eq("faculty_id", facultyId)
    .eq("status", "requested")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const results: FacultyLetterRequest[] = [];
  for (const row of data) {
    results.push({
      requestId: row.id as string,
      studentName: await studentName(db, row.student_id as string),
      courseContext: (row.course_context as string | null) ?? null,
      studentNote: (row.student_note as string | null) ?? null,
      createdAt: row.created_at as string,
    });
  }
  return results;
}

/** Finalized (non-draft) letters, newest first. */
export async function listFacultyFinalizedLetters(
  db: SupabaseClient,
  facultyId: string,
): Promise<FacultyFinalizedLetter[]> {
  const { data, error } = await db
    .from("letters")
    .select("id, student_id, finalized_at, student_preview_enabled")
    .eq("faculty_id", facultyId)
    .eq("is_draft", false)
    .order("finalized_at", { ascending: false });

  if (error || !data) return [];

  const results: FacultyFinalizedLetter[] = [];
  for (const row of data) {
    results.push({
      letterId: row.id as string,
      studentName: await studentName(db, row.student_id as string),
      finalizedAt: row.finalized_at as string,
      studentPreviewEnabled: (row.student_preview_enabled as boolean) ?? false,
    });
  }
  return results;
}
