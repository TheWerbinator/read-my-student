// Database side of the credit wallet. Callers pass the admin (secret key)
// client: students can read their ledger but never write it.

import type { SupabaseClient } from "@supabase/supabase-js";
import { yearlyFreeAllocation } from "@/lib/billing";
import { CATALOG_COLUMNS, type CatalogRow } from "@/lib/catalog";
import {
  dueFreeAllocations,
  freeGrantRef,
  grantExpiry,
  pickGrant,
  remaining,
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
  /** Faculty dependents: requests cost no credit until then (owner, 2026-11-11). */
  free_requests_until?: string | null;
};

/** True while a faculty dependent's free requests last. */
export function hasFreeRequests(row: StudentRow, now: Date): boolean {
  return !!row.free_requests_until && new Date(row.free_requests_until) > now;
}

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
 * Adds the free credits the student is due now (HS and UG each year), if not
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
    .select(CATALOG_COLUMNS)
    .in("kind", ["free_allocation", "membership"])
    .eq("stage", student.stage)
    .eq("active", true);
  if (error) throw error;

  const catalog: CatalogItem[] = ((rows ?? []) as CatalogRow[]).filter((r) => r.kind === "free_allocation").map((r) => ({
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
  // Yearly free credits live on that year's membership row (migration 20261116000000).
  const yearly = yearlyFreeAllocation((rows ?? []) as CatalogRow[], year, now);
  if (yearly) due.push(yearly);
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
 * Records paid credits. The unique source_ref (the Stripe invoice or Checkout
 * Session) makes a repeated webhook a no-op (BRD PAY-02, UAT-07).
 */
export async function grantPurchasedCredits(
  db: SupabaseClient,
  grant: {
    studentId: string;
    catalogId: string;
    source: "membership" | "credits" | "bundle";
    quantity: number;
    expiresAt: Date | null;
    sourceRef: string;
    paymentIntent: string | null;
  },
): Promise<"granted" | "already"> {
  const { data, error } = await db
    .from("credit_grants")
    .upsert(
      {
        student_id: grant.studentId,
        catalog_id: grant.catalogId,
        source: grant.source,
        quantity: grant.quantity,
        expires_at: grant.expiresAt?.toISOString() ?? null,
        source_ref: grant.sourceRef,
        stripe_payment_intent: grant.paymentIntent,
      },
      { onConflict: "source_ref", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw error;
  return data && data.length > 0 ? "granted" : "already";
}

/**
 * After a Stripe refund, removes the credits still unused on the grants that
 * payment bought. Credits already spent stay spent. Safe to repeat: a second
 * call finds nothing left to remove. shortcut: this is not locked against a
 * concurrent spend, so a request racing the refund can leave a grant at -1;
 * move it into SQL beside consume_credit if refunds become frequent.
 */
export async function removeUnusedCredits(
  db: SupabaseClient,
  paymentIntent: string,
  reason: string,
): Promise<number> {
  const { data: grants, error } = await db
    .from("credit_grants")
    .select("id, student_id")
    .eq("stripe_payment_intent", paymentIntent);
  if (error) throw error;

  let removed = 0;
  for (const g of grants ?? []) {
    const wallet = await loadWallet(db, g.student_id as string);
    const grant = wallet.grants.find((w) => w.id === g.id);
    const left = grant ? remaining(grant, wallet.events) : 0;
    if (left <= 0) continue;
    const { error: insertError } = await db
      .from("credit_events")
      .insert({ grant_id: g.id, type: "adjust", delta: -left, reason });
    if (insertError) throw insertError;
    removed += left;
  }
  return removed;
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
