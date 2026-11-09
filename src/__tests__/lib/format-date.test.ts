import { formatDate } from "@/lib/format-date";

describe("formatDate", () => {
  it("writes the month as a word so day and month cannot be swapped", () => {
    expect(formatDate("2026-11-07T12:00:00Z")).toBe("7 Nov 2026");
  });
});
