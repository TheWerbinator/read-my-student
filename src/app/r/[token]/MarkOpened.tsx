"use client";

import { useEffect } from "react";
import { markRequestOpened } from "@/app/actions/letters";

/**
 * Records the professor's first open from the browser, after the page runs,
 * so email link scanners that only fetch the URL do not count as an open.
 */
export function MarkOpened({ token }: { token: string }) {
  useEffect(() => {
    void markRequestOpened(token);
  }, [token]);
  return null;
}
