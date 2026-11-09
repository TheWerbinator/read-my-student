import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

/**
 * Runs `handle` for a Stripe event unless the event was already processed.
 *
 * Stripe can deliver one event more than once, and it retries failed
 * deliveries (https://docs.stripe.com/webhooks.md). The event row is marked
 * processed only after `handle` succeeds. If `handle` throws, the error
 * propagates so the route can answer 500 and Stripe retries.
 *
 * `handle` must itself be safe to run twice, because a failed attempt can
 * stop partway and the retry runs it again.
 */
export async function processStripeEventOnce(
  db: SupabaseClient,
  event: Stripe.Event,
  handle: (event: Stripe.Event) => Promise<void>,
): Promise<"processed" | "duplicate"> {
  const { data: seen, error: readError } = await db
    .from("stripe_events")
    .select("processed_at")
    .eq("event_id", event.id)
    .maybeSingle();
  if (readError) throw readError;
  if (seen?.processed_at) return "duplicate";

  const { error: insertError } = await db
    .from("stripe_events")
    .upsert(
      { event_id: event.id, type: event.type },
      { onConflict: "event_id", ignoreDuplicates: true },
    );
  if (insertError) throw insertError;

  await handle(event);

  const { error: doneError } = await db
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", event.id);
  if (doneError) throw doneError;

  return "processed";
}
