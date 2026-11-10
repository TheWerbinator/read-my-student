"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { connectExtension } from "./actions";

type Runtime = {
  sendMessage: (id: string, message: unknown, callback: (response?: { ok?: boolean }) => void) => void;
  lastError?: { message?: string };
};

export function ConnectButton({ extensionId }: { extensionId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function connect() {
    // The page has chrome.runtime only when an installed extension lists this site in externally_connectable.
    const runtime = (window as unknown as { chrome?: { runtime?: Runtime } }).chrome?.runtime;
    if (!runtime?.sendMessage) return setState("error");
    setState("busy");
    const issued = await connectExtension();
    if (!issued) return setState("error");
    runtime.sendMessage(extensionId, { type: "connect", ...issued }, (response) => {
      setState(!runtime.lastError && response?.ok ? "done" : "error");
    });
  }

  if (state === "done") {
    return (
      <p role='status' className='mt-3 text-ink'>
        The extension is connected. You can close this tab.
      </p>
    );
  }
  return (
    <>
      <p className='mt-3 text-ink'>
        The extension will show your open requests and sealed letters, and your profile details for school forms. It
        stays connected for 30 days, or until you disconnect it.
      </p>
      <Button variant='gold' size='lg' className='mt-6 w-full' disabled={state === "busy"} onClick={connect}>
        {state === "busy" ? "Connecting..." : "Connect the extension"}
      </Button>
      {state === "error" && (
        <p role='alert' className='mt-3 text-destructive'>
          The extension did not answer. Make sure that it is installed and turned on in this browser, then click
          Connect in the extension again.
        </p>
      )}
    </>
  );
}
