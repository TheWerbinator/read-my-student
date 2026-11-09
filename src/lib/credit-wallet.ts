// Database side of the credit wallet. Callers pass the admin (secret key)
// client: students can read their ledger but never write it.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dueFreeAllocations,
  freeGrantRef,
  grantExpiry,
  pickGrant,
  type CatalogItem,
  type CreditEvent,
  type CreditGrant,
  type Stage,
  type StudentYear,
} from "@/lib/credits";

export type StudentRow = {
  id: string;
  stage: Stage | null;
  study_year: number | null;
  year_started_on: string | null;
};

export function studentYear(row: StudentRow): StudentYear {
  return {
    stage: row.stage,
    studyYear: row.study_year,
    yearStartedOn: row.year_started_on ? new Date(`${row.year_started_on}T00:00:00Z`) : null,
  };
}

export async function loadWallet(
  db: SupabaseClient,
  studentId: string,
): Promise<{ grants: CreditGrant[]; events: CreditEvent[] }> {
  const { data: grantRows, error } = await db
    .from("credit_grants")
    .select("id, quantity, expires_at")
    .eq("student_id", studentId);
  if (error) throw error;

  const grants = (grantRows ?? []).map((g) => ({
    id: g.id as string,
    quantity: g.quantity as number,
    expiresAt: g.expires_at ? new Date(g.expires_at as string) : null,
  }));
  if (grants.length === 0) return { grants, events: [] };

  const { data: eventRows, error: eventError } = await db
    .from("credit_events")
    .select("grant_id, type, delta")
    .in("grant_id", grants.map((g) => g.id));
  if (eventError) throw eventError;

  const events = (eventRows ?? []).map((e) => ({
    grantId: e.grant_id as string,
    type: e.type as CreditEvent["type"],
    delta: e.delta as number,
  }));
  return { grants, events };
}

/**
 * Adds the free credits the student is due now (HS once, UG each year), if not
 * already granted. Safe to call on every dashboard load or request: the unique
 * source_ref turns a repeat into a no-op. Free credits stack on paid ones (DEC-04).
 */
export async function ensureFreeGrants(
  db: SupabaseClient,
  student: StudentRow,
  now: Date,
): Promise<void> {
  if (!student.stage) return;
  const { data: rows, error } = await db
    .from("plan_catalog")
    .select("id, stage, study_year, kind, credits, expiry, expiry_year")
    .eq("kind", "free_allocation")
    .eq("stage", student.stage)
    .eq("active", true);
  if (error) throw error;

  const catalog: CatalogItem[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    stage: r.stage as Stage,
    studyYear: r.study_year as number | null,
    kind: r.kind as CatalogItem["kind"],
    credits: r.credits as number,
    expiry: r.expiry as CatalogItem["expiry"],
    expiryYear: r.expiry_year as number | null,
  }));

  const year = studentYear(student);
  const due = dueFreeAllocations(catalog, year, now);
  if (due.length === 0) return;

  const { error: insertError } = await db.from("credit_grants").upsert(
    due.map((item) => ({
      student_id: student.id,
      catalog_id: item.id,
      source: "free_allocation",
      quantity: item.credits,
      expires_at: grantExpiry(item, year, now)?.toISOString() ?? null,
      source_ref: freeGrantRef(item, student.id),
    })),
    { onConflict: "source_ref", ignoreDuplicates: true },
  );
  if (insertError) throw insertError;
}

/**
 * Spends one credit for a letter request from the soonest-expiring grant.
 * consume_credit() locks the grant, so two requests cannot both spend its last
 * credit. The loser gets 'unavailable' and picks the next grant.
 */
export async function spendCredit(
  db: SupabaseClient,
  studentId: string,
  requestId: string,
  now: Date,
): Promise<"consumed" | "already" | "no_credits"> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { grants, events } = await loadWallet(db, studentId);
    const grant = pickGrant(grants, events, now);
    if (!grant) return "no_credits";

    const { data, error } = await db.rpc("consume_credit", {
      p_request_id: requestId,
      p_grant_id: grant.id,
    });
    if (error) throw error;
    if (data === "consumed" || data === "already") return data;
  }
  throw new Error(`Could not spend a credit for request ${requestId} after 3 attempts.`);
}

/**
 * Returns the credit a request spent to the grant it came from. A grant that
 * expired in the meantime stays expired (BRD 5.2: expiry belongs to the grant).
 * The unique index allows one refund per request, so a decline and the day-7
 * sweep cannot both refund.
 */
export async function refundCredit(
  db: SupabaseClient,
  requestId: string,
): Promise<"refunded" | "already" | "not_spent"> {
  const { data: consume, error } = await db
    .from("credit_events")
    .select("grant_id")
    .eq("request_id", requestId)
    .eq("type", "consume")
    .maybeSingle();
  if (error) throw error;
  if (!consume) return "not_spent";

  const { error: insertError } = await db.from("credit_events").insert({
    grant_id: consume.grant_id,
    request_id: requestId,
    type: "refund",
    delta: 1,
  });
  if (insertError?.code === "23505") return "already";
  if (insertError) throw insertError;
  return "refunded";
}
