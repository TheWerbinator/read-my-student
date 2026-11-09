/**
 * One unambiguous date format for the app: "7 Nov 2026". A numeric date like
 * 11/7/2026 reads as 11 July in India and as 7 November in the US.
 */
export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
