/**
 * @jest-environment node
 *
 * Unit tests for the emailed request link token and the sweep cutoffs.
 * The Supabase clients are mocked; nothing here touches a database.
 */

jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn(() => ({})) }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("resend", () => ({ Resend: jest.fn() }));

import {
  hashToken,
  isClosedStatus,
  requestLinkToken,
} from "@/lib/request-access";
import { sweepCutoffs } from "@/lib/request-sweep";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

describe("request link token", () => {
  const original = process.env.PDF_SIGNING_SECRET;
  beforeEach(() => {
    process.env.PDF_SIGNING_SECRET = "unit-test-secret-at-least-32-chars!!";
  });
  afterAll(() => {
    process.env.PDF_SIGNING_SECRET = original;
  });

  it("is the same for the same request, so the reminder can rebuild the link", () => {
    expect(requestLinkToken(ID_A)).toBe(requestLinkToken(ID_A));
  });

  it("differs per request and is URL-safe", () => {
    const a = requestLinkToken(ID_A);
    expect(a).not.toBe(requestLinkToken(ID_B));
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("changes when the secret changes", () => {
    const before = requestLinkToken(ID_A);
    process.env.PDF_SIGNING_SECRET = "a-different-secret-also-32-chars-long";
    expect(requestLinkToken(ID_A)).not.toBe(before);
  });

  it("refuses to build a token without a secret", () => {
    delete process.env.PDF_SIGNING_SECRET;
    expect(() => requestLinkToken(ID_A)).toThrow("PDF_SIGNING_SECRET");
  });

  it("stores only a SHA-256 hex hash of the token", () => {
    const token = requestLinkToken(ID_A);
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
  });
});

describe("isClosedStatus", () => {
  it("closes declined and expired requests only", () => {
    expect(isClosedStatus("rejected")).toBe(true);
    expect(isClosedStatus("expired")).toBe(true);
    expect(isClosedStatus("requested")).toBe(false);
    expect(isClosedStatus("in_progress")).toBe(false);
  });
});

describe("sweepCutoffs", () => {
  it("reminds after 3 days and expires after 7", () => {
    const now = new Date("2027-01-10T12:00:00Z");
    expect(sweepCutoffs(now)).toEqual({
      remindBefore: "2027-01-07T12:00:00.000Z",
      expireBefore: "2027-01-03T12:00:00.000Z",
    });
  });
});
