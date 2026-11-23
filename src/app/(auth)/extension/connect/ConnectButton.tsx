"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { connectExtension } from "./actions";

// Must match extension/entrypoints/connect.content.ts, which runs on this page only.
const CHANNEL = "readmystudent-extension";

/** Posts a message to the extension's content script and waits for the reply type, or null on timeout. */
function ask(message: object, replyType: string, ms: number): Promise<{ ok?: boolean } | null> {
  return new Promise((resolve) => {
    const done = (value: { ok?: boolean } | null) => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(value);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source === window && e.origin === location.origin && e.data?.channel === CHANNEL && e.data.type === replyType) {
        done(e.data);
      }
    };
    const timer = setTimeout(() => done(null), ms);
    window.addEventListener("message", onMessage);
    window.postMessage({ channel: CHANNEL, ...message }, location.origin);
  });
}

export function ConnectButton() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "missing" | "error">("idle");

  async function connect() {
    setState("busy");
    // Ask first, so no token is made when the extension is not there.
    if (!(await ask({ type: "ping" }, "pong", 1500))) return setState("missing");
    const issued = await connectExtension();
    if (!issued) return setState("error");
    const answer = await ask({ type: "connect", ...issued }, "connected", 5000);
    setState(answer?.ok ? "done" : "error");
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
      {state === "missing" && (
        <p role='alert' className='mt-3 text-destructive'>
          The extension did not answer. Install the ReadMyStudent extension in this browser, make sure that it is
          turned on, then reload this page.
        </p>
      )}
      {state === "error" && (
        <p role='alert' className='mt-3 text-destructive'>
          The connection did not finish. Reload this page and try again.
        </p>
      )}
    </>
  );
}
