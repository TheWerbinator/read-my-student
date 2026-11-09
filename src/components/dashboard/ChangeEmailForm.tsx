"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateEmail } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmailForm({
  className,
  currentEmail,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { currentEmail?: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateEmail(newEmail);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setNewEmail("");
    }

    setIsLoading(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className='sheet space-y-6 p-6'>
        <div className='space-y-1.5'>
          <h2 className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'>
            Change Email Address
          </h2>
          <p className='text-sm text-ink-2'>
            {currentEmail ? (
              <>
                Current address:{" "}
                <span className='font-semibold text-ink'>{currentEmail}</span>
              </>
            ) : (
              "Update the email address associated with your account."
            )}
          </p>
        </div>

        {success ? (
          <div
            role='status'
            className='border border-sealed/40 bg-paper-2 p-4 text-sm text-ink'
          >
            <p className='font-semibold text-sealed'>Verification email sent.</p>
            <p className='mt-1 text-ink-2'>
              Check{" "}
              <span className='font-semibold text-ink'>
                {newEmail || "your new address"}
              </span>{" "}
              for a confirmation link. Your email will update once you click it.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
            <div className='grid gap-2'>
              <Label htmlFor='newEmail' className='caption text-ink-2'>
                New email address <span className='text-declined'>*</span>
              </Label>
              <Input
                id='newEmail'
                type='email'
                placeholder='you@example.com'
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            {error && (
              <div
                role='alert'
                className='border border-declined/40 bg-paper-2 p-3 text-sm text-declined'
              >
                {error}
              </div>
            )}

            <Button type='submit' size='lg' disabled={isLoading}>
              {isLoading ? "Sending verification…" : "Send Verification Email"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
