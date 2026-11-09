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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PREFIX_OPTIONS = ["", "Dr.", "Prof.", "Mr.", "Ms.", "Mrs.", "Mx."];

// Evaluated once at module load, stable enough for a 30-day expiry warning.
const MODULE_LOAD_TS = Date.now();

const CAPTION = "caption text-ink-2";

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

export type FacultyAuthDetails = {
  email: string;
  firstName: string;
  lastName: string;
};

// Names and email live on the auth user, not the faculty row. Phone and
// sign-off are not persisted yet, so they start from defaults.
function rowToFields(
  row: FacultyProfileRow | null,
  auth: FacultyAuthDetails,
): Fields {
  return {
    prefix: row?.prefix ?? "",
    firstName: auth.firstName,
    lastName: auth.lastName,
    email: auth.email,
    phone: "",
    title: row?.title ?? "",
    department: row?.department ?? "",
    organization: row?.institution ?? "",
    street: row?.street ?? "",
    city: row?.city ?? "",
    state: row?.state ?? "",
    postalCode: row?.postal_code ?? "",
    country: row?.country ?? "",
    signOff: "Sincerely,",
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
      <div role='alert' className='border border-declined/40 bg-paper-2 p-3 text-sm text-declined'>
        <p className='font-semibold'>
          This file has expired and will be removed at the next cleanup.
          Re-upload to continue using it on new letters.
        </p>
        <Button
          type='button'
          variant='outline'
          className='mt-2 h-11'
          onClick={onReupload}
        >
          Re-upload now
        </Button>
      </div>
    );
  }

  return (
    <div className='border border-waiting/40 bg-paper-2 p-3 text-sm text-ink'>
      <p className='font-semibold text-waiting'>
        Expires in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}.
      </p>
      <p className='mt-0.5 text-ink-2'>
        Per our retention policy, raw asset files are kept for one year.
        Re-upload to replace, or confirm to extend for another year.
      </p>
      <div className='mt-2 flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          className='h-11'
          onClick={onReupload}
        >
          Re-upload
        </Button>
        <Button
          type='button'
          disabled={isConfirming}
          className='h-11'
          onClick={onConfirm}
        >
          {isConfirming ? "Confirming…" : "Keep existing file"}
        </Button>
      </div>
      {confirmError && (
        <p role='alert' className='mt-1 text-xs text-declined'>
          {confirmError}
        </p>
      )}
    </div>
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export function FacultyProfileSettingsForm({
  initialProfile,
  authDetails,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  initialProfile: FacultyProfileRow | null;
  authDetails: FacultyAuthDetails;
}) {
  const [fields, setFields] = useState<Fields>(
    rowToFields(initialProfile, authDetails),
  );
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
      <div className='sheet space-y-6 p-6'>
        <div className='space-y-1.5'>
          <h2 className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'>
            Profile
          </h2>
          <p className='text-sm text-ink-2'>
            Your name and contact details as they appear on letters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          {/* Name row */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='grid gap-2'>
              <Label htmlFor='prefix' className={CAPTION}>
                Prefix
              </Label>
              <select
                id='prefix'
                value={fields.prefix}
                onChange={set("prefix")}
                className='h-11 w-full rounded-[2px] border border-input bg-white px-3 text-base text-ink focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'
              >
                {PREFIX_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p === "" ? "None" : p}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='firstName' className={CAPTION}>
                First name
              </Label>
              <Input
                id='firstName'
                value={fields.firstName}
                onChange={set("firstName")}
                placeholder='Jane'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='lastName' className={CAPTION}>
                Last name
              </Label>
              <Input
                id='lastName'
                value={fields.lastName}
                onChange={set("lastName")}
                placeholder='Smith'
              />
            </div>
          </div>

          {/* Institutional info */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='title' className={CAPTION}>
                Academic title
              </Label>
              <Input
                id='title'
                value={fields.title}
                onChange={set("title")}
                placeholder='e.g. Associate Professor'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='department' className={CAPTION}>
                Department
              </Label>
              <Input
                id='department'
                value={fields.department}
                onChange={set("department")}
                placeholder='e.g. Life Sciences'
              />
            </div>
            <div className='grid gap-2 sm:col-span-2'>
              <Label htmlFor='organization' className={CAPTION}>
                Institution
              </Label>
              <Input
                id='organization'
                value={fields.organization}
                onChange={set("organization")}
                placeholder='e.g. University of Example'
              />
            </div>
          </div>

          {/* Contact */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='email' className={CAPTION}>
                Letterhead email
              </Label>
              <Input
                id='email'
                type='email'
                value={fields.email}
                onChange={set("email")}
                placeholder='professor@university.edu'
              />
              <p className='text-xs text-ink-2'>
                Shown on letters and used by students to find you.
              </p>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='phone' className={CAPTION}>
                Phone
              </Label>
              <Input
                id='phone'
                type='tel'
                value={fields.phone}
                onChange={set("phone")}
                placeholder='Include country code'
              />
            </div>
          </div>

          {/* Address */}
          <fieldset className='grid gap-4 border-t border-rule pt-5'>
            <legend className={cn(CAPTION, "float-left mb-4 w-full")}>
              Mailing address
            </legend>
            <div className='grid gap-2'>
              <Label htmlFor='street' className={CAPTION}>
                Street
              </Label>
              <Input
                id='street'
                value={fields.street}
                onChange={set("street")}
                placeholder='Street and number'
              />
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='city' className={CAPTION}>
                  City
                </Label>
                <Input
                  id='city'
                  value={fields.city}
                  onChange={set("city")}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='state' className={CAPTION}>
                  State / province
                </Label>
                <Input
                  id='state'
                  value={fields.state}
                  onChange={set("state")}
                />
              </div>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='postalCode' className={CAPTION}>
                  Postal code
                </Label>
                <Input
                  id='postalCode'
                  value={fields.postalCode}
                  onChange={set("postalCode")}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='country' className={CAPTION}>
                  Country
                </Label>
                <Input
                  id='country'
                  value={fields.country}
                  onChange={set("country")}
                />
              </div>
            </div>
          </fieldset>

          {/* Sign-off */}
          <div className='grid gap-2'>
            <Label htmlFor='signOff' className={CAPTION}>
              Default sign-off
            </Label>
            <Input
              id='signOff'
              value={fields.signOff}
              onChange={set("signOff")}
              placeholder='Sincerely,'
            />
            <p className='text-xs text-ink-2'>
              Closing line used at the bottom of letters (e.g.
              &ldquo;Sincerely,&rdquo; / &ldquo;Best regards,&rdquo;).
            </p>
          </div>

          {success && (
            <div
              role='status'
              className='border border-sealed/40 bg-paper-2 p-3 text-sm text-sealed'
            >
              Profile saved.
            </div>
          )}
          {error && (
            <div
              role='alert'
              className='border border-declined/40 bg-paper-2 p-3 text-sm text-declined'
            >
              {error}
            </div>
          )}

          <Button type='submit' size='lg' disabled={isPending}>
            {isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </div>

      {/* ── Assets ───────────────────────────────────────────────────────── */}
      <div className='sheet space-y-6 p-6'>
        <div className='space-y-1.5'>
          <h2 className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'>
            Letterhead assets
          </h2>
          <p className='text-sm text-ink-2'>
            Logo and signature image used on your letters. You can also swap
            these per-letter inside the letter editor.
          </p>
        </div>

        <div className='flex flex-col divide-y divide-rule border-y border-rule'>
          {/* Logo */}
          <div className='flex flex-col gap-3 py-4'>
            <div className='flex items-center justify-between gap-4'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-ink'>
                  Institution logo
                </p>
                <p className='mt-0.5 truncate text-xs text-ink-2'>
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
                onClick={() => logoRef.current?.click()}
                className='h-11 shrink-0'
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
          <div className='flex flex-col gap-3 py-4'>
            <div className='flex items-center justify-between gap-4'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-ink'>
                  Signature image
                </p>
                <p className='mt-0.5 truncate text-xs text-ink-2'>
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
                onClick={() => sigRef.current?.click()}
                className='h-11 shrink-0'
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
        </div>

        {assetError && (
          <div
            role='alert'
            className='border border-declined/40 bg-paper-2 p-3 text-sm text-declined'
          >
            {assetError}
          </div>
        )}
      </div>
    </div>
  );
}
