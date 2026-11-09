/**
 * @jest-environment node
 *
 * Unit tests for the admin gate: requireAdmin() and the catalog save action.
 * Supabase is mocked; the integration test covers the real tables.
 */

const mockGetClaims = jest.fn();
const mockAdminRow = jest.fn();
const mockSave = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mockGetClaims } }),
}));
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockAdminRow }) }) }),
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { requireAdmin } from "@/lib/admin";
import { formFromRow } from "@/lib/catalog";

jest.mock("@/lib/admin", () => ({
  ...jest.requireActual("@/lib/admin"),
  saveCatalogItem: (...args: unknown[]) => mockSave(...args),
}));

const signedIn = (sub: string | null) =>
  mockGetClaims.mockResolvedValue({ data: sub ? { claims: { sub } } : null });

beforeEach(() => jest.clearAllMocks());

describe("requireAdmin", () => {
  it("returns null when nobody is signed in", async () => {
    signedIn(null);
    expect(await requireAdmin()).toBeNull();
    expect(mockAdminRow).not.toHaveBeenCalled();
  });

  it("returns null for a signed-in user without an admins row", async () => {
    signedIn("user-1");
    mockAdminRow.mockResolvedValue({ data: null, error: null });
    expect(await requireAdmin()).toBeNull();
  });

  it("returns the user id for an admin", async () => {
    signedIn("admin-1");
    mockAdminRow.mockResolvedValue({ data: { user_id: "admin-1" }, error: null });
    expect(await requireAdmin()).toBe("admin-1");
  });

  it("throws when the lookup fails, instead of treating the user as a non-admin", async () => {
    signedIn("admin-1");
    mockAdminRow.mockResolvedValue({ data: null, error: new Error("db down") });
    await expect(requireAdmin()).rejects.toThrow("db down");
  });
});

describe("saveCatalogItemAction", () => {
  const action = async () => (await import("@/app/admin/actions")).saveCatalogItemAction;

  it("refuses a non-admin and writes nothing", async () => {
    signedIn("user-1");
    mockAdminRow.mockResolvedValue({ data: null, error: null });
    const save = await action();
    expect(await save(null, { ...formFromRow(null), priceUsd: "1.00" })).toEqual({
      ok: false,
      errors: { form: "You do not have access to the catalog." },
    });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("returns field errors without saving", async () => {
    signedIn("admin-1");
    mockAdminRow.mockResolvedValue({ data: { user_id: "admin-1" }, error: null });
    const save = await action();
    expect(await save(null, formFromRow(null))).toMatchObject({ ok: false, errors: { priceUsd: "Enter a price." } });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("saves a valid form as the admin", async () => {
    signedIn("admin-1");
    mockAdminRow.mockResolvedValue({ data: { user_id: "admin-1" }, error: null });
    mockSave.mockResolvedValue({});
    const save = await action();
    expect(await save("row-1", { ...formFromRow(null), priceUsd: "1.00" })).toEqual({ ok: true });
    expect(mockSave).toHaveBeenCalledWith(expect.anything(), "admin-1", "row-1", expect.objectContaining({ price_usd_cents: 100 }));
  });
});
