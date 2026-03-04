"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateEmail } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
        <CardHeader className='pb-4'>
          <CardTitle className='font-serif text-2xl font-semibold text-green-900'>
            Change Email Address
          </CardTitle>
          <CardDescription className='text-green-900/70'>
            {currentEmail ? (
              <>
                Current address:{" "}
                <span className='font-medium text-green-900'>
                  {currentEmail}
                </span>
              </>
            ) : (
              "Update the email address associated with your account."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {success ? (
            <div className='rounded-xl bg-green-50 p-4 text-sm text-green-800'>
              <p className='font-semibold'>Verification email sent!</p>
              <p className='mt-1 text-green-700'>
                Check{" "}
                <span className='font-medium'>
                  {newEmail || "your new address"}
                </span>{" "}
                for a confirmation link. Your email will update once you click
                it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='newEmail' className='font-medium text-gray-800'>
                  New email address <span className='text-red-600'>*</span>
                </Label>
                <Input
                  id='newEmail'
                  type='email'
                  placeholder='you@example.com'
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-green-900 focus-visible:ring-green-900/20'
                />
              </div>

              {error && (
                <div className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>
                  ❌ {error}
                </div>
              )}

              <Button
                type='submit'
                disabled={isLoading}
                className='rounded-xl bg-green-900 px-6 py-5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60'
              >
                {isLoading
                  ? "Sending verification…"
                  : "Send Verification Email"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
