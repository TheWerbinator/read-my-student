"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const ROLES = [
  { value: "STUDENT", label: "Student", hint: "Ask for a letter" },
  { value: "FACULTY", label: "Professor", hint: "Faculty and instructors" },
] as const;

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className='text-sm text-declined'>
      {children}
    </span>
  );
}

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
    // Errors show after a field is blurred or after a submit attempt.
    mode: "onTouched",
    defaultValues: {
      role: defaultRole as "STUDENT" | "FACULTY",
      // Prefilled from the request page's account prompt.
      email: searchParams.get("email") ?? "",
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

  const errors = form.formState.errors;

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

  const invalid = (name: keyof RegisterFormValues) =>
    errors[name] ? true : undefined;
  const describedBy = (name: keyof RegisterFormValues) =>
    errors[name] ? `${name}-error` : undefined;

  const orgError =
    role === "STUDENT" ? errors.university : errors.institution;

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div className='sheet p-6 md:p-8'>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5'
          noValidate
        >
          {/* Role Selector */}
          <div role='group' aria-labelledby='role-label'>
            <span id='role-label' className='caption mb-2 block text-ink-2'>
              I am a...
            </span>
            <div className='grid grid-cols-2 gap-2'>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type='button'
                  aria-pressed={role === r.value}
                  onClick={() => form.setValue("role", r.value)}
                  className={cn(
                    "min-h-14 rounded-[2px] border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    role === r.value
                      ? "border-forest bg-forest text-white"
                      : "border-input bg-white text-ink hover:bg-paper-2",
                  )}
                >
                  <span className='block font-display text-lg font-bold uppercase leading-none tracking-[0.06em]'>
                    {r.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-xs",
                      role === r.value ? "text-white/85" : "text-ink-2",
                    )}
                  >
                    {r.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Fields */}
          <div className='grid gap-5 sm:grid-cols-2 sm:gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='firstName' className='caption text-ink-2'>
                First name
              </Label>
              <Input
                id='firstName'
                autoComplete='given-name'
                {...form.register("firstName")}
                placeholder='Jane'
                aria-invalid={invalid("firstName")}
                aria-describedby={describedBy("firstName")}
              />
              {errors.firstName && (
                <FieldError id='firstName-error'>
                  Enter your first name (2 letters or more).
                </FieldError>
              )}
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='lastName' className='caption text-ink-2'>
                Last name
              </Label>
              <Input
                id='lastName'
                autoComplete='family-name'
                {...form.register("lastName")}
                placeholder='Doe'
                aria-invalid={invalid("lastName")}
                aria-describedby={describedBy("lastName")}
              />
              {errors.lastName && (
                <FieldError id='lastName-error'>
                  Enter your last name (2 letters or more).
                </FieldError>
              )}
            </div>
          </div>

          {/* Email */}
          <div className='grid gap-2'>
            <Label htmlFor='email' className='caption text-ink-2'>
              Email
            </Label>
            <Input
              id='email'
              autoComplete='email'
              {...form.register("email")}
              type='email'
              placeholder={
                role === "STUDENT"
                  ? "you@university.edu"
                  : "professor@university.edu"
              }
              aria-invalid={invalid("email")}
              aria-describedby={describedBy("email")}
            />
            {errors.email && (
              <FieldError id='email-error'>
                Enter a full email address, like name@school.edu.
              </FieldError>
            )}
          </div>

          {/* Location & Institution Logic */}
          <div className='space-y-5'>
            <div className='grid gap-2'>
              <CountryCombobox
                value={countryCode}
                onChange={(val: string) =>
                  form.setValue("countryCode", val, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                invalid={!!errors.countryCode}
                errorId='countryCode-error'
              />
              {errors.countryCode && (
                <FieldError id='countryCode-error'>
                  Choose your country. We use it to list the schools there.
                </FieldError>
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
                invalid={!!orgError}
                errorId='org-error'
              />
              {/* Check errors based on role */}
              {role === "STUDENT" && errors.university && (
                <FieldError id='org-error'>
                  Search for your university and pick it from the list.
                </FieldError>
              )}
              {role === "FACULTY" && errors.institution && (
                <FieldError id='org-error'>
                  Search for your institution and pick it from the list.
                </FieldError>
              )}
            </div>
          </div>

          {/* DYNAMIC FIELDS: STUDENT */}
          {role === "STUDENT" && (
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='program' className='caption text-ink-2'>
                  Program / major
                </Label>
                <Input
                  id='program'
                  {...form.register("program")}
                  placeholder='e.g. Biology'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='graduationDate' className='caption text-ink-2'>
                  Graduation date
                </Label>
                <Input
                  id='graduationDate'
                  {...form.register("graduationDate")}
                  type='date'
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FACULTY */}
          {role === "FACULTY" && (
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='title' className='caption text-ink-2'>
                  Academic title
                </Label>
                <Input
                  id='title'
                  {...form.register("title")}
                  placeholder='e.g. Associate Professor'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='department' className='caption text-ink-2'>
                  Department
                </Label>
                <Input
                  id='department'
                  {...form.register("department")}
                  placeholder='e.g. Life Sciences'
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className='grid gap-2'>
            <Label htmlFor='password' className='caption text-ink-2'>
              Password
            </Label>
            <Input
              id='password'
              autoComplete='new-password'
              {...form.register("password")}
              type='password'
              placeholder='••••••••'
              aria-invalid={invalid("password")}
              aria-describedby={describedBy("password")}
            />
            {errors.password ? (
              <FieldError id='password-error'>
                Use at least 8 characters.
              </FieldError>
            ) : (
              <span className='text-sm text-ink-2'>At least 8 characters.</span>
            )}
          </div>

          {/* Error Message Display */}
          {serverError && (
            <div role='alert' className='text-sm text-declined'>
              {serverError}. Check your details and try again.
            </div>
          )}

          {/* Submit */}
          <Button
            type='submit'
            variant='gold'
            size='lg'
            disabled={isPending}
            className='w-full'
          >
            {isPending ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className='perforation mt-6' />
        <p className='mt-5 text-sm text-ink-2'>
          Already have an account?{" "}
          <Link
            href='/login'
            className='font-semibold text-forest underline underline-offset-4'
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
