"use client";

// The admin screen needs an authenticator-app code on every login (BRD §12.1).
// First visit: scan a QR code and confirm one code. Later visits: one code.
// Flow from https://supabase.com/docs/guides/auth/auth-mfa/totp.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step =
  | { kind: "loading" }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "verify"; factorId: string }
  | { kind: "failed"; message: string };

export function MfaGate() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const show = (next: Step) => !cancelled && setStep(next);
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return show({ kind: "failed", message: error.message });
      const verified = data.totp[0];
      if (verified) return show({ kind: "verify", factorId: verified.id });

      // A QR code that was never confirmed cannot be used, so remove it before making a new one.
      for (const f of data.all) {
        if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "readmystudent.com" });
      if (enrolled.error) return show({ kind: "failed", message: enrolled.error.message });
      show({ kind: "enroll", factorId: enrolled.data.id, qr: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step.kind !== "enroll" && step.kind !== "verify") return;
    setPending(true);
    setError("");
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: step.factorId, code: code.trim() });
    setPending(false);
    if (error) {
      setError("That code did not work. Enter the current 6-digit code from your authenticator app.");
      return;
    }
    // The session now carries aal2, so the server renders the catalog.
    router.refresh();
  };

  return (
    <div className='p-6 md:p-10'>
      <section aria-labelledby='mfa-heading' className='sheet mx-auto max-w-md p-6 text-ink'>
        <h1
          id='mfa-heading'
          className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'
        >
          {step.kind === "enroll" ? "Set up your code" : "Enter your code"}
        </h1>

        {step.kind === "loading" && <p className='mt-4 text-ink-2'>Loading…</p>}

        {step.kind === "failed" && (
          <p role='alert' className='mt-4 text-declined'>
            The code step could not start: {step.message}
          </p>
        )}

        {step.kind === "enroll" && (
          <>
            <p className='mt-4'>
              The admin screen needs a code from an authenticator app, such as Google Authenticator, 1Password, or
              Authy. Scan this QR code with the app, then enter the 6-digit code it shows.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- an SVG data URL from Supabase */}
            <img src={step.qr} alt='QR code for your authenticator app' className='mx-auto mt-4 size-48 bg-white p-2' />
            <p className='mt-3 text-sm text-ink-2'>
              Cannot scan it? Type this key into the app instead:{" "}
              <code className='break-all font-mono text-ink'>{step.secret}</code>
            </p>
          </>
        )}

        {step.kind === "verify" && <p className='mt-4'>Enter the 6-digit code from your authenticator app.</p>}

        {(step.kind === "enroll" || step.kind === "verify") && (
          <form onSubmit={onSubmit} className='mt-5 grid gap-3' noValidate>
            <Label htmlFor='mfa-code' className='caption text-ink-2'>
              6-digit code
            </Label>
            <Input
              id='mfa-code'
              inputMode='numeric'
              autoComplete='one-time-code'
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "mfa-error" : undefined}
            />
            {error && (
              <p id='mfa-error' role='alert' className='text-sm text-declined'>
                {error}
              </p>
            )}
            <Button type='submit' disabled={pending || code.trim().length !== 6}>
              {pending ? "Checking…" : "Continue"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
