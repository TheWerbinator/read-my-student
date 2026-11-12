"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formFromRow, type CatalogForm, type CatalogRow } from "@/lib/catalog";
import { saveCatalogItemAction } from "./actions";

const selectClass =
  "h-11 w-full rounded-[2px] border border-input bg-white px-3 text-base text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-gold aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive";

const YEARS = Array.from({ length: 12 }, (_, i) => i + 1);

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id} className='caption text-ink-2'>
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className='text-sm text-declined'>
          {error}
        </p>
      )}
    </div>
  );
}

export function CatalogItemDialog({ row, label }: { row: CatalogRow | null; label: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatalogForm>(() => formFromRow(row));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const set = <K extends keyof CatalogForm>(key: K, value: CatalogForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const fieldProps = (name: keyof CatalogForm) => ({
    id: id(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id(name)}-error` : undefined,
  });
  const free = form.kind === "free_allocation";

  const onOpenChange = (next: boolean) => {
    if (next) {
      setForm(formFromRow(row));
      setErrors({});
    }
    setOpen(next);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveCatalogItemAction(row?.id ?? null, form);
      if (result.ok) setOpen(false);
      else setErrors(result.errors);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {row ? (
          <Button variant='secondary' size='sm' aria-label={label}>
            Edit
          </Button>
        ) : (
          <Button variant='gold'>{label}</Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>{row ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription className='text-ink-2'>
            Changes apply to new purchases and new grants only. Every save is recorded.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className='grid gap-5' noValidate>
          <div className='grid gap-5 sm:grid-cols-2'>
            <Field id={id("stage")} label='Stage' error={errors.stage}>
              <select
                {...fieldProps("stage")}
                className={selectClass}
                value={form.stage}
                onChange={(e) => set("stage", e.target.value as CatalogForm["stage"])}
              >
                <option value='hs'>High school</option>
                <option value='ug'>Undergraduate</option>
                <option value='masters'>Master&apos;s</option>
                <option value='phd'>PhD or working professional</option>
              </select>
            </Field>
            <Field id={id("kind")} label='Item' error={errors.kind}>
              <select
                {...fieldProps("kind")}
                className={selectClass}
                value={form.kind}
                onChange={(e) => set("kind", e.target.value as CatalogForm["kind"])}
              >
                <option value='membership'>Membership</option>
                <option value='credits'>Single credit (extra or pay as you go)</option>
                <option value='bundle'>Bundle</option>
                <option value='free_allocation'>Free credits</option>
              </select>
            </Field>
            <Field id={id("studyYear")} label='Year in school' error={errors.studyYear}>
              <select
                {...fieldProps("studyYear")}
                className={selectClass}
                value={String(form.studyYear)}
                onChange={(e) => set("studyYear", e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value=''>Any year (free credits: once, or each year for HS)</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={id("credits")} label='Credits' error={errors.credits}>
              <Input
                {...fieldProps("credits")}
                type='number'
                min={1}
                inputMode='numeric'
                value={String(form.credits)}
                onChange={(e) => set("credits", e.target.value)}
              />
            </Field>
            {form.kind === "membership" && (
              <Field id={id("freeCredits")} label='Free credits that year, membership or not' error={errors.freeCredits}>
                <Input
                  {...fieldProps("freeCredits")}
                  type='number'
                  min={0}
                  inputMode='numeric'
                  value={String(form.freeCredits)}
                  onChange={(e) => set("freeCredits", e.target.value)}
                />
              </Field>
            )}
            <Field id={id("priceUsd")} label='Price in USD' error={errors.priceUsd}>
              <Input
                {...fieldProps("priceUsd")}
                inputMode='decimal'
                placeholder={free ? "Free" : "20.00"}
                disabled={free}
                value={form.priceUsd}
                onChange={(e) => set("priceUsd", e.target.value)}
              />
            </Field>
            <Field id={id("priceInr")} label='Price in INR' error={errors.priceInr}>
              <Input
                {...fieldProps("priceInr")}
                inputMode='decimal'
                placeholder={free ? "Free" : "Not set"}
                disabled={free}
                value={form.priceInr}
                onChange={(e) => set("priceInr", e.target.value)}
              />
            </Field>
            <Field id={id("expiry")} label='Credits expire' error={errors.expiry}>
              <select
                {...fieldProps("expiry")}
                className={selectClass}
                value={form.expiry}
                onChange={(e) => set("expiry", e.target.value as CatalogForm["expiry"])}
              >
                <option value='never'>Never</option>
                <option value='end_of_year'>End of the year they are granted</option>
                <option value='end_of_year_n'>End of a set year</option>
              </select>
            </Field>
            {form.expiry === "end_of_year_n" && (
              <Field id={id("expiryYear")} label='Last year' error={errors.expiryYear}>
                <select
                  {...fieldProps("expiryYear")}
                  className={selectClass}
                  value={String(form.expiryYear)}
                  onChange={(e) => set("expiryYear", e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value=''>Choose a year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      End of Year {y}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {form.kind === "credits" && (
            <label className='flex items-center gap-3 text-ink'>
              <input
                type='checkbox'
                className='size-5 accent-forest'
                checked={form.membersOnly}
                onChange={(e) => set("membersOnly", e.target.checked)}
              />
              Members only (an extra credit). Leave it off for pay as you go.
            </label>
          )}

          <label className='flex items-center gap-3 text-ink'>
            <input
              type='checkbox'
              className='size-5 accent-forest'
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            On sale (students can buy or receive it)
          </label>

          {errors.form && (
            <div role='alert' className='border border-declined/40 bg-paper-2 p-3 text-sm text-declined'>
              {errors.form}
            </div>
          )}

          <DialogFooter>
            <Button type='submit' disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
