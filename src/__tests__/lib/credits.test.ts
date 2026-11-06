/**
 * @jest-environment node
 *
 * Unit tests for the credit wallet math. Pure functions, no database.
 */

import { balance, pickGrant, remaining, type CreditEvent, type CreditGrant } from "@/lib/credits";

const now = new Date("2027-01-15T00:00:00Z");
const grant = (id: string, quantity: number, expiresAt: string | null): CreditGrant => ({
  id,
  quantity,
  expiresAt: expiresAt ? new Date(expiresAt) : null,
});

describe("credit wallet", () => {
  const free = grant("ug-free-y1", 3, "2027-06-30T00:00:00Z");
  const paid = grant("ug-paid-y1", 20, "2031-06-30T00:00:00Z");
  const topup = grant("topup", 5, null);

  it("spends the soonest-expiring grant first, never-expiring last", () => {
    expect(pickGrant([topup, paid, free], [], now)?.id).toBe("ug-free-y1");
  });

  it("moves to the next grant when one is used up", () => {
    const events: CreditEvent[] = [1, 2, 3].map(() => ({
      grantId: "ug-free-y1",
      type: "consume",
      delta: -1,
    }));
    expect(remaining(free, events)).toBe(0);
    expect(pickGrant([free, paid], events, now)?.id).toBe("ug-paid-y1");
  });

  it("ignores expired grants in balance and selection", () => {
    const later = new Date("2027-07-01T00:00:00Z");
    expect(balance([free, paid], [], later)).toBe(20);
    expect(pickGrant([free], [], later)).toBeNull();
  });

  it("restores a credit when a declined request is refunded", () => {
    const events: CreditEvent[] = [
      { grantId: "ug-paid-y1", type: "consume", delta: -1 },
      { grantId: "ug-paid-y1", type: "refund", delta: 1 },
    ];
    expect(balance([paid], events, now)).toBe(20);
  });

  it("sums every usable grant", () => {
    expect(balance([free, paid, topup], [], now)).toBe(28);
  });

  it("returns null for an empty wallet", () => {
    expect(pickGrant([], [], now)).toBeNull();
  });
});
