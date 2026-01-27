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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "../../../public/green_yellow_logo_sized.png";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-3xl font-serif font-semibold text-[#0b4726]'>
            Reset Your Password
          </CardTitle>
          <CardDescription className='text-[#0b4726]/70'>
            Please enter your new password below.
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
                <Label htmlFor='password' className='font-medium text-gray-800'>
                  New password <span className='text-red-600'>*</span>
                </Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter your new password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {isLoading ? "Saving..." : "Save new password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
