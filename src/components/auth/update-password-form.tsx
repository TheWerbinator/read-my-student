"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const router = useRouter();

  const passwordError = !password
    ? "Enter a new password."
    : password.length < 8
      ? "Use at least 8 characters."
      : null;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (passwordError) return;
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div className='sheet p-6 md:p-8'>
        <form onSubmit={handleForgotPassword} noValidate>
          <div className='flex flex-col gap-5'>
            <div className='grid gap-2'>
              <Label htmlFor='password' className='caption text-ink-2'>
                New password
              </Label>
              <Input
                id='password'
                type='password'
                autoComplete='new-password'
                placeholder='At least 8 characters'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !!passwordError}
                aria-describedby={touched && passwordError ? "password-error" : undefined}
              />
              {touched && passwordError && (
                <span id='password-error' className='text-sm text-declined'>
                  {passwordError}
                </span>
              )}
            </div>

            {error && (
              <div role='alert' className='text-sm text-declined'>
                {error}. Request a new reset link if this one has expired.
              </div>
            )}

            <Button
              type='submit'
              variant='gold'
              size='lg'
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? "Saving..." : "Save new password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
