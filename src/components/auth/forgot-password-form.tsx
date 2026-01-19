"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Logo from "../../../public/green_yellow_logo_sized.png";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className={cn("flex flex-col gap-6 mt-50", className)} {...props}>
      {success ? (
        <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-3xl font-serif font-semibold text-[#0b4726]'>
              Check Your Email
            </CardTitle>
            <CardDescription className='text-[#0b4726]/70'>
              Password reset instructions sent
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <p className='text-sm text-muted-foreground'>
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-3xl font-serif font-semibold text-[#0b4726]'>
                Reset Your Password
              </CardTitle>
              <CardDescription className='text-[#0b4726]/70'>
                Type in your email and we&apos;ll send you a link to reset your
                password
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Brand Logo Row */}
              <div className='flex items-center gap-3 rounded-2xl bg-slate-50/50 p-2 -mx-2 mb-4'>
                <div className='rounded-xl border border-black/10 bg-white p-2 shadow-sm'>
                  <Image
                    src={Logo}
                    alt='ReadMyStudent logo'
                    className='h-6 w-auto'
                    priority
                  />
                </div>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-[#0b4726]'>
                    ReadMyStudent
                  </div>
                  <div className='text-xs text-black/50'>
                    Secure recommendation letters
                  </div>
                </div>
              </div>

              <form onSubmit={handleForgotPassword}>
                <div className='flex flex-col gap-6'>
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='email'
                      className='font-medium text-gray-800'
                    >
                      Email <span className='text-red-600'>*</span>
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='you@university.edu'
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-[#0b4726] focus-visible:ring-[#0b4726]/20'
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
                    className='w-full rounded-2xl bg-[#0b4726] py-6 text-sm font-semibold text-white shadow-md transition hover:bg-[#0b4726]/90 hover:shadow-lg disabled:opacity-60'
                  >
                    {isLoading ? "Sending..." : "Send reset email"}
                  </Button>
                </div>
                <div className='mt-6 text-center text-sm text-black/60'>
                  Already have an account?{" "}
                  <Link
                    href='/login'
                    className='font-semibold text-[#0b4726] hover:underline'
                  >
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Form Footer Links
          <div className='text-center text-xs text-black/45'>
            By logging in, you agree to our{" "}
            <Link className='text-[#0b4726] hover:underline' href='/terms'>
              Terms
            </Link>{" "}
            and{" "}
            <Link className='text-[#0b4726] hover:underline' href='/privacy'>
              Privacy Policy
            </Link>
            .
          </div> */}
        </>
      )}
    </div>
  );
}
