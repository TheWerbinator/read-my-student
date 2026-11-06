/**
 * @jest-environment node
 *
 * The proxy must only guard /dashboard. Public pages, the Stripe webhook,
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

  it("redirects /dashboard to /login", async () => {
    const res = await visit("/dashboard/settings");
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});
