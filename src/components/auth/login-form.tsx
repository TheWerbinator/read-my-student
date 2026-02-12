"use client";

import { cn } from "@/lib/utils";
import { createClient } from "../../lib/supabase/client";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "../../../public/green_yellow_logo_sized.png";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Restoring the "soft" card look:
        - rounded-3xl (larger corners)
        - shadow-xl shadow-black/5 (soft, deep shadow)
        - border-black/10 (subtle border)
      */}
      <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
        <CardHeader className='pb-4'>
          {/* Restoring the Serif Font and Green Color */}
          <CardTitle className='text-3xl font-serif font-semibold text-green-900'>
            Welcome back
          </CardTitle>
          <CardDescription className='text-green-900/70'>
            Log in to continue your recommendation workflow.
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
              <div className='text-sm font-semibold text-green-900'>
                ReadMyStudent
              </div>
              <div className='text-xs text-black/50'>
                Secure recommendation letters
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email' className='font-medium text-gray-800'>
                  Email <span className='text-red-600'>*</span>
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='you@university.edu'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-green-900 focus-visible:ring-green-900/20'
                />
              </div>

              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label
                    htmlFor='password'
                    className='font-medium text-gray-800'
                  >
                    Password <span className='text-red-600'>*</span>
                  </Label>
                  <Link
                    href='/forgot-password'
                    className='ml-auto inline-block text-xs font-semibold text-green-900 hover:underline'
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id='password'
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                className='w-full rounded-2xl bg-green-900 py-6 text-sm font-semibold text-white shadow-md transition hover:bg-green-900/90 hover:shadow-lg disabled:opacity-60'
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
            </div>

            <div className='mt-6 text-center text-sm text-black/60'>
              Don&apos;t have an account?{" "}
              <Link
                href='/signup'
                className='font-semibold text-green-900 hover:underline'
              >
                Create an account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Form Footer Links */}
      <div className='text-center text-xs text-black/45'>
        By logging in, you agree to our{" "}
        <Link className='text-green-900 hover:underline' href='/terms'>
          Terms
        </Link>{" "}
        and{" "}
        <Link className='text-green-900 hover:underline' href='/privacy'>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
