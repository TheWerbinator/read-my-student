"use client";

import { cn } from "@/lib/utils";
import { createClient } from "../../lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Field errors appear after blur or a submit attempt, never on load.
  const [touched, setTouched] = useState({ email: false, password: false });
  const router = useRouter();

  const emailError = !email.trim()
    ? "Enter the email you signed up with."
    : !/^\S+@\S+\.\S+$/.test(email.trim())
      ? "This email looks incomplete. Use the form name@school.edu."
      : null;
  const passwordError = password ? null : "Enter your password.";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError || passwordError) return;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
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
        <form onSubmit={handleLogin} noValidate>
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
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={touched.email && !!emailError}
                aria-describedby={touched.email && emailError ? "email-error" : undefined}
              />
              {touched.email && emailError && (
                <span id='email-error' className='text-sm text-declined'>
                  {emailError}
                </span>
              )}
            </div>

            <div className='grid gap-2'>
              <div className='flex items-center justify-between gap-3'>
                <Label htmlFor='password' className='caption text-ink-2'>
                  Password
                </Label>
                <Link
                  href='/forgot-password'
                  className='inline-flex min-h-11 items-center text-sm font-semibold text-forest underline-offset-4 hover:underline'
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                autoComplete='current-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                aria-invalid={touched.password && !!passwordError}
                aria-describedby={touched.password && passwordError ? "password-error" : undefined}
              />
              {touched.password && passwordError && (
                <span id='password-error' className='text-sm text-declined'>
                  {passwordError}
                </span>
              )}
            </div>

            {error && (
              <div role='alert' className='text-sm text-declined'>
                {error}. Check your email and password, then try again.
              </div>
            )}

            <Button
              type='submit'
              variant='gold'
              size='lg'
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </div>
        </form>

        <div className='perforation mt-6' />
        <p className='mt-5 text-sm text-ink-2'>
          Don&apos;t have an account?{" "}
          <Link
            href='/signup'
            className='font-semibold text-forest underline underline-offset-4'
          >
            Create an account
          </Link>
        </p>
      </div>

      <p className='text-sm text-flap-dim'>
        By logging in, you agree to our{" "}
        <Link className='text-flap-ink underline' href='/terms'>
          Terms
        </Link>{" "}
        and{" "}
        <Link className='text-flap-ink underline' href='/privacy'>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
