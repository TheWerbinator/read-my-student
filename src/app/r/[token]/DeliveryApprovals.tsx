"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { approveDelivery, rejectDelivery } from "@/app/actions/letters";

export type DeliveryToApprove = {
  id: string;
  schoolName: string;
  schoolEmail: string | null;
};

/** School deliveries waiting on the professor, answered with the request link token. */
export function DeliveryApprovals({
  token,
  studentName,
  deliveries,
}: {
  token: string;
  studentName: string;
  deliveries: DeliveryToApprove[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function answer(id: string, approve: boolean) {
    setBusy(id);
    setError(null);
    const result = approve ? await approveDelivery(id, token) : await rejectDelivery(id, token);
    setBusy(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className='space-y-3 border-t border-rule pt-5'>
      <h2 className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
        Schools waiting for your approval
      </h2>
      <p className='text-sm text-ink-2'>
        {studentName} asked to send your letter to these addresses. Approve
        only an address that belongs to the school&apos;s admissions office. The
        school gets a secure link that works for 48 hours.
      </p>
      {error && (
        <p role='alert' className='text-sm text-declined'>
          {error}
        </p>
      )}
      <ul className='divide-y divide-rule border-y border-rule'>
        {deliveries.map((d) => (
          <li key={d.id} className='flex flex-wrap items-center justify-between gap-3 py-3'>
            <span className='min-w-0'>
              <span className='block font-semibold'>{d.schoolName}</span>
              <span className='block break-all text-sm text-ink-2'>
                {d.schoolEmail ?? "No address on file"}
              </span>
            </span>
            <span className='flex gap-2'>
              <Button
                type='button'
                variant='gold'
                className='h-11'
                disabled={busy !== null}
                onClick={() => void answer(d.id, true)}
              >
                {busy === d.id ? "Working…" : "Approve"}
              </Button>
              <Button
                type='button'
                variant='outline'
                className='h-11'
                disabled={busy !== null}
                onClick={() => void answer(d.id, false)}
              >
                Decline
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
