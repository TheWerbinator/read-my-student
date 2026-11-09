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
  professorEmail,
}: {
  token: string;
  requestId: string;
  studentName: string;
  professorEmail?: string | null;
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
          defaultEmail={professorEmail}
          onFinalized={() => router.refresh()}
        />
        {!declining && (
          <Button
            type='button'
            variant='outline'
            className='h-11'
            onClick={() => setDeclining(true)}
          >
            Decline
          </Button>
        )}
      </div>

      {declining && (
        <div className='space-y-3 border-t border-rule pt-4'>
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
            <p role='alert' className='text-sm text-declined'>
              {error}
            </p>
          )}
          <div className='flex gap-3'>
            <Button
              type='button'
              variant='destructive'
              className='h-11'
              disabled={isSubmitting}
              onClick={handleDecline}
            >
              {isSubmitting ? "Declining…" : "Decline request"}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='h-11'
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
