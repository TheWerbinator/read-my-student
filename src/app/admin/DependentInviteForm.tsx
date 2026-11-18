"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteDependentAction } from "./actions";

const FIELDS = [
  { name: "dependentName", label: "Dependent's name", type: "text" },
  { name: "dependentEmail", label: "Dependent's email", type: "email" },
  { name: "facultyEmail", label: "Professor's account email", type: "email" },
] as const;

type Form = Record<(typeof FIELDS)[number]["name"], string>;
const EMPTY: Form = { dependentName: "", dependentEmail: "", facultyEmail: "" };

/** Sends a faculty dependent the invite email for 3 years of free requests. */
export function DependentInviteForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteDependentAction(form);
      if (result.ok) {
        setMessage({ ok: true, text: `Invite sent to ${form.dependentEmail}.` });
        setForm(EMPTY);
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className='mt-4 grid gap-4 sm:grid-cols-3' noValidate>
      {FIELDS.map((f) => (
        <div key={f.name} className='grid gap-2'>
          <Label htmlFor={`invite-${f.name}`} className='caption text-ink-2'>
            {f.label}
          </Label>
          <Input
            id={`invite-${f.name}`}
            type={f.type}
            value={form[f.name]}
            onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))}
          />
        </div>
      ))}
      <div className='flex flex-wrap items-center gap-4 sm:col-span-3'>
        <Button type='submit' disabled={pending}>
          {pending ? "Sending…" : "Send invite"}
        </Button>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-ink" : "text-sm text-declined"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
