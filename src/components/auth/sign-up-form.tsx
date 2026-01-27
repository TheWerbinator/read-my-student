"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "../../../public/green_yellow_logo_sized.png";

// Components
import { CountryCombobox } from "@/components/auth/CountryCombobox";
import { UniversityCombobox } from "@/components/auth/UniversityCombobox"; // Ensure this matches the file you provided

// Backend
import { registerSchema, RegisterFormValues } from "@/lib/schemas";
import { signUpAction } from "@/app/actions/register";

// Type definition from your UniversityCombobox
type University = {
  id: string;
  name: string;
  countryCode: string;
  city?: string;
  region?: string;
  homepageUrl?: string;
  ror?: string | null;
};

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramRole = searchParams.get("role")?.toUpperCase();

  const defaultRole =
    paramRole === "FACULTY" || paramRole === "STUDENT" ? paramRole : "STUDENT";

  // We need local state for the University Object because the Combobox
  // needs the full object to display the name/city, but the Form only wants the String ID/Name.
  const [selectedUniversity, setSelectedUniversity] =
    useState<University | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole as "STUDENT" | "FACULTY",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      countryCode: "",
      // Student defaults
      university: "",
      universityOpeId: "",
      program: "",
      graduationDate: "",
      // Faculty defaults
      institution: "",
      institutionOpeId: "",
      title: "",
      department: "",
    },
  });

  // Watchers to trigger UI updates
  const role = form.watch("role");
  const countryCode = form.watch("countryCode");

  // Reset university selection if Country or Role changes
  useEffect(() => {
    setSelectedUniversity(null);
    form.setValue("university", "");
    form.setValue("universityOpeId", "");
    form.setValue("institution", "");
    form.setValue("institutionOpeId", "");
  }, [countryCode, role, form]);

  function onSubmit(data: RegisterFormValues) {
    setServerError(null);

    startTransition(async () => {
      const result = await signUpAction(data);

      if (result.success) {
        router.push("/sign-up-success");
      } else {
        setServerError(result.error || "Something went wrong");
      }
    });
  }

  // Bridge function: Syncs Combobox Object -> Form Strings
  const handleUniversityChange = (u: University | null) => {
    setSelectedUniversity(u);

    if (role === "STUDENT") {
      form.setValue("university", u?.name || "");
      form.setValue("universityOpeId", u?.id || ""); // Assuming ID is the OPEID or unique ref
    } else {
      form.setValue("institution", u?.name || "");
      form.setValue("institutionOpeId", u?.id || "");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-3xl font-serif font-semibold text-[#0b4726]'>
            Create account
          </CardTitle>
          <CardDescription className='text-[#0b4726]/70'>
            Join ReadMyStudent to get started
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

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Role Selector */}
            <div>
              <Label className='mb-2 block text-sm font-semibold text-[#0b4726]'>
                I am a...
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                {(["STUDENT", "FACULTY"] as const).map((r) => (
                  <button
                    key={r}
                    type='button'
                    onClick={() => form.setValue("role", r)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                      role === r
                        ? "border-[#0b4726] bg-[#0b4726]/10 text-[#0b4726]"
                        : "border-black/10 bg-white text-black/60 hover:bg-black/5",
                    )}
                  >
                    {r === "STUDENT" ? "Student" : "Faculty"}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Fields */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='firstName'>First Name</Label>
                <Input
                  {...form.register("firstName")}
                  placeholder='Jane'
                  className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-[#0b4726] focus-visible:ring-[#0b4726]/20'
                />
                {form.formState.errors.firstName && (
                  <span className='text-xs text-red-600'>
                    {form.formState.errors.firstName.message}
                  </span>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input
                  {...form.register("lastName")}
                  placeholder='Doe'
                  className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-[#0b4726] focus-visible:ring-[#0b4726]/20'
                />
                {form.formState.errors.lastName && (
                  <span className='text-xs text-red-600'>
                    {form.formState.errors.lastName.message}
                  </span>
                )}
              </div>
            </div>

            {/* Email */}
            <div className='grid gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                {...form.register("email")}
                type='email'
                placeholder={
                  role === "STUDENT"
                    ? "you@university.edu"
                    : "professor@university.edu"
                }
                className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-[#0b4726] focus-visible:ring-[#0b4726]/20'
              />
              {form.formState.errors.email && (
                <span className='text-xs text-red-600'>
                  {form.formState.errors.email.message}
                </span>
              )}
            </div>

            {/* Location & Institution Logic */}
            <div className='space-y-4 rounded-2xl border border-black/5 bg-slate-50 p-4'>
              <div className='grid gap-2'>
                <CountryCombobox
                  value={countryCode}
                  onChange={(val: string) => form.setValue("countryCode", val)}
                />
                {form.formState.errors.countryCode && (
                  <span className='text-xs text-red-600'>
                    Please select a country
                  </span>
                )}
              </div>

              <div className='grid gap-2'>
                <UniversityCombobox
                  label={role === "STUDENT" ? "University" : "Institution"}
                  required
                  countryCode={countryCode}
                  value={selectedUniversity} // Pass the Object
                  onChange={handleUniversityChange} // Use the bridge function
                  disabled={!countryCode}
                />
                {/* Check errors based on role */}
                {role === "STUDENT" && form.formState.errors.university && (
                  <span className='text-xs text-red-600'>
                    University is required
                  </span>
                )}
                {role === "FACULTY" && form.formState.errors.institution && (
                  <span className='text-xs text-red-600'>
                    Institution is required
                  </span>
                )}
              </div>
            </div>

            {/* DYNAMIC FIELDS: STUDENT */}
            {role === "STUDENT" && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500'>
                <div className='grid gap-2'>
                  <Label htmlFor='program'>Program / Major</Label>
                  <Input
                    {...form.register("program")}
                    placeholder='e.g. Biology'
                    className='rounded-xl border-black/15 bg-white px-3 py-5'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='graduationDate'>Graduation Date</Label>
                  <Input
                    {...form.register("graduationDate")}
                    type='date'
                    className='rounded-xl border-black/15 bg-white px-3 py-5'
                  />
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS: FACULTY */}
            {role === "FACULTY" && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500'>
                <div className='grid gap-2'>
                  <Label htmlFor='title'>Academic Title</Label>
                  <Input
                    {...form.register("title")}
                    placeholder='e.g. Associate Professor'
                    className='rounded-xl border-black/15 bg-white px-3 py-5'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='department'>Department</Label>
                  <Input
                    {...form.register("department")}
                    placeholder='e.g. Life Sciences'
                    className='rounded-xl border-black/15 bg-white px-3 py-5'
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className='grid gap-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                {...form.register("password")}
                type='password'
                placeholder='••••••••'
                className='rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-[#0b4726] focus-visible:ring-[#0b4726]/20'
              />
              {form.formState.errors.password && (
                <span className='text-xs text-red-600'>
                  {form.formState.errors.password.message}
                </span>
              )}
            </div>

            {/* Error Message Display */}
            {serverError && (
              <div className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>
                ❌ {serverError}
              </div>
            )}

            {/* Submit */}
            <Button
              type='submit'
              disabled={isPending}
              className='w-full rounded-2xl bg-[#0b4726] py-6 text-sm font-semibold text-white shadow-md transition hover:bg-[#0b4726]/90 hover:shadow-lg disabled:opacity-60'
            >
              {isPending ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm text-black/60'>
            Already have an account?{" "}
            <Link
              href='/login'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
