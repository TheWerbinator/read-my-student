// Credit wallet math. Grants are immutable; every change is a signed ledger event
// (consume -1, refund +1, expire -n, adjust +/-n) against one grant (BRD 5.2).

export type CreditGrant = {
  id: string;
  quantity: number;
  expiresAt: Date | null; // null = never expires
};

export type CreditEvent = {
  grantId: string;
  type: "consume" | "refund" | "expire" | "adjust";
  delta: number;
};

export function remaining(grant: CreditGrant, events: CreditEvent[]): number {
  return events
    .filter((e) => e.grantId === grant.id)
    .reduce((sum, e) => sum + e.delta, grant.quantity);
}

/** Grants that can pay for a request now, soonest-expiring first. */
export function usableGrants(
  grants: CreditGrant[],
  events: CreditEvent[],
  now: Date,
): CreditGrant[] {
  return grants
    .filter((g) => (g.expiresAt === null || g.expiresAt > now) && remaining(g, events) > 0)
    .sort(
      (a, b) =>
        (a.expiresAt?.getTime() ?? Infinity) - (b.expiresAt?.getTime() ?? Infinity),
    );
}

export function balance(grants: CreditGrant[], events: CreditEvent[], now: Date): number {
  return usableGrants(grants, events, now).reduce((sum, g) => sum + remaining(g, events), 0);
}

/** The grant the next request should spend from, or null when the wallet is empty. */
export function pickGrant(
  grants: CreditGrant[],
  events: CreditEvent[],
  now: Date,
): CreditGrant | null {
  return usableGrants(grants, events, now)[0] ?? null;
}
