/**
 * @jest-environment node
 *
 * The proxy must only guard /dashboard and /admin. Public pages, the Stripe webhook,
 * the cron route and /view/[token] must stay reachable without a session.
 */

import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

jest.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: async () => ({ data: { claims: null } }) },
  }),
}));

const visit = (path: string) => updateSession(new NextRequest(`https://example.com${path}`));

describe("proxy (logged out)", () => {
  it.each(["/", "/pricing", "/signup", "/login", "/view/abc", "/api/webhooks/stripe", "/api/cron/cleanup"])(
    "lets %s through",
    async (path) => {
      expect((await visit(path)).headers.get("location")).toBeNull();
    },
  );

  it.each(["/dashboard", "/dashboard/settings", "/admin", "/admin/anything"])(
    "redirects %s to /login",
    async (path) => {
      const res = await visit(path);
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    },
  );

  it("does not guard paths that only share a prefix", async () => {
    expect((await visit("/administrator")).headers.get("location")).toBeNull();
  });
});
