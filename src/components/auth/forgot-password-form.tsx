"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError = !email.trim()
    ? "Enter the email on your account."
    : !/^\S+@\S+\.\S+$/.test(email.trim())
      ? "This email looks incomplete. Use the form name@school.edu."
      : null;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailError) return;
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div className='sheet p-6 md:p-8'>
        {success ? (
          <div role='status'>
            <h2 className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.02em]'>
              Check your email
            </h2>
            <p className='mt-3 text-ink'>
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} noValidate>
            <div className='flex flex-col gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='email' className='caption text-ink-2'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  placeholder='you@university.edu'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={touched && !!emailError}
                  aria-describedby={touched && emailError ? "email-error" : undefined}
                />
                {touched && emailError && (
                  <span id='email-error' className='text-sm text-declined'>
                    {emailError}
                  </span>
                )}
              </div>

              {error && (
                <div role='alert' className='text-sm text-declined'>
                  {error}. Check the address and try again.
                </div>
              )}

              <Button
                type='submit'
                variant='gold'
                size='lg'
                disabled={isLoading}
                className='w-full'
              >
                {isLoading ? "Sending..." : "Send reset email"}
              </Button>
            </div>
          </form>
        )}

        <div className='perforation mt-6' />
        <p className='mt-5 text-sm text-ink-2'>
          {success ? "Back to " : "Already have an account? "}
          <Link
            href='/login'
            className='font-semibold text-forest underline underline-offset-4'
          >
            {success ? "Log in" : "Login"}
          </Link>
        </p>
      </div>
    </div>
  );
}
