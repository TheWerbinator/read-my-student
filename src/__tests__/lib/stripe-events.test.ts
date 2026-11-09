/**
 * @jest-environment node
 *
 * Unit tests for Stripe webhook idempotency. The database is an in-memory fake
 * of the stripe_events table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { processStripeEventOnce } from "@/lib/stripe-events";

type Row = { type: string; processed_at: string | null };

function fakeDb(existing?: Row, readError: Error | null = null) {
  const rows = new Map<string, Row>();
  if (existing) rows.set("evt_1", { ...existing });
  const db = {
    from: () => ({
      select: () => ({
        eq: (_col: string, id: string) => ({
          maybeSingle: async () => ({ data: readError ? null : (rows.get(id) ?? null), error: readError }),
        }),
      }),
      upsert: async (row: { event_id: string; type: string }) => {
        if (!rows.has(row.event_id)) rows.set(row.event_id, { type: row.type, processed_at: null });
        return { error: null };
      },
      update: (patch: Partial<Row>) => ({
        eq: async (_col: string, id: string) => {
          Object.assign(rows.get(id)!, patch);
          return { error: null };
        },
      }),
    }),
  };
  return { db: db as unknown as SupabaseClient, rows };
}

const event = { id: "evt_1", type: "checkout.session.completed" } as Stripe.Event;

describe("processStripeEventOnce", () => {
  it("runs a new event once and marks it processed", async () => {
    const { db, rows } = fakeDb();
    const handle = jest.fn().mockResolvedValue(undefined);
    await expect(processStripeEventOnce(db, event, handle)).resolves.toBe("processed");
    expect(handle).toHaveBeenCalledTimes(1);
    expect(rows.get("evt_1")?.processed_at).not.toBeNull();
  });

  it("skips an event that was already processed", async () => {
    const { db } = fakeDb({ type: event.type, processed_at: "2026-11-09T00:00:00Z" });
    const handle = jest.fn();
    await expect(processStripeEventOnce(db, event, handle)).resolves.toBe("duplicate");
    expect(handle).not.toHaveBeenCalled();
  });

  it("runs again after an earlier attempt failed", async () => {
    const { db, rows } = fakeDb({ type: event.type, processed_at: null });
    const handle = jest.fn().mockResolvedValue(undefined);
    await expect(processStripeEventOnce(db, event, handle)).resolves.toBe("processed");
    expect(handle).toHaveBeenCalledTimes(1);
    expect(rows.get("evt_1")?.processed_at).not.toBeNull();
  });

  it("leaves the event unprocessed when the handler throws", async () => {
    const { db, rows } = fakeDb();
    const handle = jest.fn().mockRejectedValue(new Error("email down"));
    await expect(processStripeEventOnce(db, event, handle)).rejects.toThrow("email down");
    expect(rows.get("evt_1")?.processed_at).toBeNull();
  });

  it("throws without running the handler when the lookup fails", async () => {
    const { db } = fakeDb(undefined, new Error("db down"));
    const handle = jest.fn();
    await expect(processStripeEventOnce(db, event, handle)).rejects.toThrow("db down");
    expect(handle).not.toHaveBeenCalled();
  });
});
