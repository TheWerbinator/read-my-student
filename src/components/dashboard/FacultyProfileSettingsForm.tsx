"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  saveFacultyProfile,
  uploadFacultyAsset,
  refreshAssetTimestamp,
} from "@/app/actions/faculty";
import type { FacultyProfileRow } from "@/lib/faculty-profile";
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

const PREFIX_OPTIONS = ["", "Dr.", "Prof.", "Mr.", "Ms.", "Mrs.", "Mx."];

// Evaluated once at module load — stable enough for a 30-day expiry warning.
const MODULE_LOAD_TS = Date.now();

const INPUT_CLS =
  "rounded-xl border-black/15 bg-white px-3 py-5 text-black focus-visible:border-green-900 focus-visible:ring-green-900/20";

type Fields = {
  prefix: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  organization: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  signOff: string;
};

function rowToFields(row: FacultyProfileRow | null): Fields {
  return {
    prefix: row?.prefix ?? "",
    firstName: row?.first_name ?? "",
    lastName: row?.last_name ?? "",
    email: row?.email ?? "",
    phone: row?.phone ?? "",
    title: row?.title ?? "",
    department: row?.department ?? "",
    organization: row?.institution ?? "",
    street: row?.street ?? "",
    city: row?.city ?? "",
    state: row?.state ?? "",
    postalCode: row?.postal_code ?? "",
    country: row?.country ?? "",
    signOff: row?.sign_off ?? "Sincerely,",
  };
}

// ─── Per-asset retention warning banner ────────────────────────────────────────

function AssetRetentionBanner({
  daysRemaining,
  onReupload,
  onConfirm,
  isConfirming,
  confirmError,
}: {
  daysRemaining: number | null;
  onReupload: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  confirmError: string | null;
}) {
  if (daysRemaining === null || daysRemaining > 30) return null;

  if (daysRemaining <= 0) {
    return (
      <div className='rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
        <p className='font-semibold'>
          ⚠️ This file has expired and will be removed at the next cleanup.
          Re-upload to continue using it on new letters.
        </p>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='mt-2 rounded-xl border-red-400 text-red-700 hover:bg-red-100'
          onClick={onReupload}
        >
          Re-upload now
        </Button>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
      <p className='font-semibold'>
        ⏳ Expires in{" "}
        <span className='underline'>
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
        </span>
        .
      </p>
      <p className='mt-0.5'>
        Per our retention policy, raw asset files are kept for one year.
        Re-upload to replace, or confirm to extend for another year.
      </p>
      <div className='mt-2 flex flex-wrap gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='rounded-xl border-amber-400 text-amber-900 hover:bg-amber-100'
          onClick={onReupload}
        >
          Re-upload
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={isConfirming}
          className='rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60'
          onClick={onConfirm}
        >
          {isConfirming ? "Confirming…" : "Keep existing file"}
        </Button>
      </div>
      {confirmError && (
        <p className='mt-1 text-xs text-red-600'>{confirmError}</p>
      )}
    </div>
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export function FacultyProfileSettingsForm({
  initialProfile,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  initialProfile: FacultyProfileRow | null;
}) {
  const [fields, setFields] = useState<Fields>(rowToFields(initialProfile));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Asset upload state
  const [logoName, setLogoName] = useState<string | null>(
    initialProfile?.logo_storage_path
      ? (initialProfile.logo_storage_path.split("/").pop() ?? "Uploaded")
      : null,
  );
  const [sigName, setSigName] = useState<string | null>(
    initialProfile?.signature_storage_path
      ? (initialProfile.signature_storage_path.split("/").pop() ?? "Uploaded")
      : null,
  );
  const [assetError, setAssetError] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  // Asset retention: per-asset upload timestamps so the clocks are independent.
  const [logoUploadedAt, setLogoUploadedAt] = useState<string | null>(
    initialProfile?.logo_uploaded_at ?? null,
  );
  const [sigUploadedAt, setSigUploadedAt] = useState<string | null>(
    initialProfile?.signature_uploaded_at ?? null,
  );
  const [logoConfirming, setLogoConfirming] = useState(false);
  const [sigConfirming, setSigConfirming] = useState(false);
  const [logoConfirmError, setLogoConfirmError] = useState<string | null>(null);
  const [sigConfirmError, setSigConfirmError] = useState<string | null>(null);

  // Days until each asset's 1-year retention window closes (null = no asset on record)
  const logoDaysRemaining = useMemo(() => {
    if (!logoUploadedAt) return null;
    return Math.ceil(
      (new Date(logoUploadedAt).getTime() +
        365 * 24 * 60 * 60 * 1000 -
        MODULE_LOAD_TS) /
        (24 * 60 * 60 * 1000),
    );
  }, [logoUploadedAt]);

  const sigDaysRemaining = useMemo(() => {
    if (!sigUploadedAt) return null;
    return Math.ceil(
      (new Date(sigUploadedAt).getTime() +
        365 * 24 * 60 * 60 * 1000 -
        MODULE_LOAD_TS) /
        (24 * 60 * 60 * 1000),
    );
  }, [sigUploadedAt]);

  async function handleConfirmAsset(assetType: "logo" | "signature") {
    if (assetType === "logo") {
      setLogoConfirming(true);
      setLogoConfirmError(null);
      const res = await refreshAssetTimestamp("logo");
      if (res.success) setLogoUploadedAt(new Date().toISOString());
      else setLogoConfirmError(res.error ?? "Failed to confirm logo.");
      setLogoConfirming(false);
    } else {
      setSigConfirming(true);
      setSigConfirmError(null);
      const res = await refreshAssetTimestamp("signature");
      if (res.success) setSigUploadedAt(new Date().toISOString());
      else setSigConfirmError(res.error ?? "Failed to confirm signature.");
      setSigConfirming(false);
    }
  }

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleAssetUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: "logo" | "signature",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadFacultyAsset(fd, assetType);
    if (!result.success) {
      setAssetError(result.error ?? "Upload failed.");
    } else {
      if (assetType === "logo") {
        setLogoName(file.name);
        setLogoUploadedAt(new Date().toISOString());
      } else {
        setSigName(file.name);
        setSigUploadedAt(new Date().toISOString());
      }
    }
    // Reset the input so the same file can be re-selected after a failure
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await saveFacultyProfile({
        ...fields,
        // relationship is per-letter; pass empty string to satisfy Required<>
        relationship: "",
      });
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* ── Personal information ─────────────────────────────────────────── */}
      <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
        <CardHeader className='pb-4'>
          <CardTitle className='font-serif text-2xl font-semibold text-green-900'>
            Profile
          </CardTitle>
          <CardDescription className='text-green-900/70'>
            Your name and contact details as they appear on letters.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
            {/* Name row */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='grid gap-2'>
                <Label htmlFor='prefix' className='font-medium text-gray-800'>
                  Prefix
                </Label>
                <select
                  id='prefix'
                  value={fields.prefix}
                  onChange={set("prefix")}
                  className='h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-black focus:border-green-900 focus:outline-none focus:ring-2 focus:ring-green-900/20'
                >
                  {PREFIX_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p === "" ? "— none —" : p}
                    </option>
                  ))}
                </select>
              </div>
              <div className='grid gap-2'>
                <Label
                  htmlFor='firstName'
                  className='font-medium text-gray-800'
                >
                  First name
                </Label>
                <Input
                  id='firstName'
                  value={fields.firstName}
                  onChange={set("firstName")}
                  placeholder='Jane'
                  className={INPUT_CLS}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='lastName' className='font-medium text-gray-800'>
                  Last name
                </Label>
                <Input
                  id='lastName'
                  value={fields.lastName}
                  onChange={set("lastName")}
                  placeholder='Smith'
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Institutional info */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='title' className='font-medium text-gray-800'>
                  Academic title
                </Label>
                <Input
                  id='title'
                  value={fields.title}
                  onChange={set("title")}
                  placeholder='e.g. Associate Professor'
                  className={INPUT_CLS}
                />
              </div>
              <div className='grid gap-2'>
                <Label
                  htmlFor='department'
                  className='font-medium text-gray-800'
                >
                  Department
                </Label>
                <Input
                  id='department'
                  value={fields.department}
                  onChange={set("department")}
                  placeholder='e.g. Life Sciences'
                  className={INPUT_CLS}
                />
              </div>
              <div className='grid gap-2 sm:col-span-2'>
                <Label
                  htmlFor='organization'
                  className='font-medium text-gray-800'
                >
                  Institution
                </Label>
                <Input
                  id='organization'
                  value={fields.organization}
                  onChange={set("organization")}
                  placeholder='e.g. State University'
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Contact */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='email' className='font-medium text-gray-800'>
                  Letterhead email
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={fields.email}
                  onChange={set("email")}
                  placeholder='professor@university.edu'
                  className={INPUT_CLS}
                />
                <p className='text-xs text-black/50'>
                  Shown on letters and used by students to find you.
                </p>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='phone' className='font-medium text-gray-800'>
                  Phone
                </Label>
                <Input
                  id='phone'
                  type='tel'
                  value={fields.phone}
                  onChange={set("phone")}
                  placeholder='+1 (555) 000-0000'
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Address */}
            <div className='rounded-2xl border border-black/5 bg-slate-50 p-4 grid gap-4'>
              <p className='text-sm font-semibold text-green-900'>
                Mailing address
              </p>
              <div className='grid gap-2'>
                <Label htmlFor='street' className='font-medium text-gray-800'>
                  Street
                </Label>
                <Input
                  id='street'
                  value={fields.street}
                  onChange={set("street")}
                  placeholder='123 University Ave'
                  className={INPUT_CLS}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='city' className='font-medium text-gray-800'>
                    City
                  </Label>
                  <Input
                    id='city'
                    value={fields.city}
                    onChange={set("city")}
                    placeholder='Springfield'
                    className={INPUT_CLS}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='state' className='font-medium text-gray-800'>
                    State / Province
                  </Label>
                  <Input
                    id='state'
                    value={fields.state}
                    onChange={set("state")}
                    placeholder='IL'
                    className={INPUT_CLS}
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label
                    htmlFor='postalCode'
                    className='font-medium text-gray-800'
                  >
                    Postal code
                  </Label>
                  <Input
                    id='postalCode'
                    value={fields.postalCode}
                    onChange={set("postalCode")}
                    placeholder='62701'
                    className={INPUT_CLS}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label
                    htmlFor='country'
                    className='font-medium text-gray-800'
                  >
                    Country
                  </Label>
                  <Input
                    id='country'
                    value={fields.country}
                    onChange={set("country")}
                    placeholder='United States'
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            </div>

            {/* Sign-off */}
            <div className='grid gap-2'>
              <Label htmlFor='signOff' className='font-medium text-gray-800'>
                Default sign-off
              </Label>
              <Input
                id='signOff'
                value={fields.signOff}
                onChange={set("signOff")}
                placeholder='Sincerely,'
                className={INPUT_CLS}
              />
              <p className='text-xs text-black/50'>
                Closing line used at the bottom of letters (e.g.
                &ldquo;Sincerely,&rdquo; / &ldquo;Best regards,&rdquo;).
              </p>
            </div>

            {success && (
              <div className='rounded-xl bg-green-50 p-3 text-sm text-green-800'>
                ✓ Profile saved successfully.
              </div>
            )}
            {error && (
              <div className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>
                ❌ {error}
              </div>
            )}

            <Button
              type='submit'
              disabled={isPending}
              className='rounded-2xl bg-green-900 py-6 text-sm font-semibold text-white shadow-md transition hover:bg-green-900/90 disabled:opacity-60'
            >
              {isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Assets ───────────────────────────────────────────────────────── */}
      <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
        <CardHeader className='pb-4'>
          <CardTitle className='font-serif text-2xl font-semibold text-green-900'>
            Letterhead assets
          </CardTitle>
          <CardDescription className='text-green-900/70'>
            Logo and signature image used on your letters. You can also swap
            these per-letter inside the letter editor.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-6'>
          {/* Logo */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-slate-50 p-4'>
              <div>
                <p className='text-sm font-semibold text-green-900'>
                  Institution logo
                </p>
                <p className='mt-0.5 truncate text-xs text-black/50'>
                  {logoName ?? "Not uploaded"}
                </p>
              </div>
              <input
                ref={logoRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => handleAssetUpload(e, "logo")}
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => logoRef.current?.click()}
                className='shrink-0 rounded-xl border-green-900 text-green-900 hover:bg-green-900/10'
              >
                {logoName ? "Replace" : "Upload"}
              </Button>
            </div>
            <AssetRetentionBanner
              daysRemaining={logoDaysRemaining}
              onReupload={() => logoRef.current?.click()}
              onConfirm={() => handleConfirmAsset("logo")}
              isConfirming={logoConfirming}
              confirmError={logoConfirmError}
            />
          </div>

          {/* Signature */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-slate-50 p-4'>
              <div>
                <p className='text-sm font-semibold text-green-900'>
                  Signature image
                </p>
                <p className='mt-0.5 truncate text-xs text-black/50'>
                  {sigName ?? "Not uploaded"}
                </p>
              </div>
              <input
                ref={sigRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => handleAssetUpload(e, "signature")}
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => sigRef.current?.click()}
                className='shrink-0 rounded-xl border-green-900 text-green-900 hover:bg-green-900/10'
              >
                {sigName ? "Replace" : "Upload"}
              </Button>
            </div>
            <AssetRetentionBanner
              daysRemaining={sigDaysRemaining}
              onReupload={() => sigRef.current?.click()}
              onConfirm={() => handleConfirmAsset("signature")}
              isConfirming={sigConfirming}
              confirmError={sigConfirmError}
            />
          </div>

          {assetError && (
            <div className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>
              ❌ {assetError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
