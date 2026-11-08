"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WriteLetterDialog } from "@/components/dashboard/WriteLetterDialog";
import { rejectLetterRequest } from "@/app/actions/letters";

export function RequestLinkActions({
  token,
  requestId,
  studentName,
}: {
  token: string;
  requestId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecline = async () => {
    setIsSubmitting(true);
    setError(null);
    const result = await rejectLetterRequest(requestId, reason, token);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <WriteLetterDialog
          studentName={studentName}
          requestId={requestId}
          accessToken={token}
          onFinalized={() => router.refresh()}
        />
        {!declining && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='rounded-lg'
            onClick={() => setDeclining(true)}
          >
            Decline
          </Button>
        )}
      </div>

      {declining && (
        <div className='space-y-3 rounded-xl border border-black/10 bg-white p-4'>
          <Label htmlFor='decline-reason'>
            Message to {studentName} (optional)
          </Label>
          <Textarea
            id='decline-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            placeholder='For example: I do not know your work well enough to write a strong letter.'
          />
          {error && (
            <p role='alert' className='text-sm text-red-700'>
              {error}
            </p>
          )}
          <div className='flex gap-3'>
            <Button
              type='button'
              size='sm'
              className='rounded-lg bg-red-700 text-white hover:bg-red-800'
              disabled={isSubmitting}
              onClick={handleDecline}
            >
              {isSubmitting ? "Declining…" : "Decline request"}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='rounded-lg'
              disabled={isSubmitting}
              onClick={() => setDeclining(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
