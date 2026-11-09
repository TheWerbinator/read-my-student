import { letterStop, requestStop } from "@/components/dashboard/stops";

const base = { status: "requested", openedAt: null, reminderSentAt: null, respondedAt: null };

describe("requestStop", () => {
  it("walks Requested, Opened, Reminded, In progress", () => {
    expect(requestStop(base).label).toBe("Requested");
    expect(requestStop({ ...base, openedAt: "2026-11-02T00:00:00Z" }).label).toBe("Opened");
    expect(requestStop({ ...base, reminderSentAt: "2026-11-04T00:00:00Z" })).toMatchObject({ label: "Reminded", lamp: "waiting" });
    expect(requestStop({ ...base, openedAt: "2026-11-02T00:00:00Z", respondedAt: "2026-11-03T00:00:00Z" }).label).toBe("In progress");
  });

  it("shows the later of a reminder and an open", () => {
    expect(requestStop({ ...base, reminderSentAt: "2026-11-04T00:00:00Z", openedAt: "2026-11-05T00:00:00Z" }).label).toBe("Opened");
    expect(requestStop({ ...base, openedAt: "2026-11-02T00:00:00Z", reminderSentAt: "2026-11-04T00:00:00Z" }).label).toBe("Reminded");
  });

  it("stops on decline and expiry whatever else happened", () => {
    expect(requestStop({ ...base, status: "rejected", openedAt: "2026-11-02T00:00:00Z" })).toMatchObject({ label: "Declined", lamp: "stopped" });
    expect(requestStop({ ...base, status: "expired", reminderSentAt: "2026-11-04T00:00:00Z" }).label).toBe("Expired");
  });
});

describe("letterStop", () => {
  it("is Sealed until a school gets a link, then Sent with a count", () => {
    expect(letterStop({ sentCount: 0 }).label).toBe("Sealed");
    expect(letterStop({ sentCount: 2 })).toMatchObject({ label: "Sent", note: "Sent to 2 schools." });
  });
});
