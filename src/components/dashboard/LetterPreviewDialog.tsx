"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getStudentLetterPreview,
  type StudentLetterPreview,
} from "@/app/actions/letters";
import type { RecommenderForm } from "@/lib/faculty-profile";
import { Eye, EyeOff } from "lucide-react";

// ─── Watermark overlay ─────────────────────────────────────────────────────────

function WatermarkOverlay() {
  // 5 × 8 grid of diagonally-rotated stamps fills most letter sizes
  const stamps = Array.from({ length: 40 });
  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-0 z-10 overflow-hidden'
    >
      <div className='grid h-full w-full grid-cols-5 grid-rows-8 gap-0'>
        {stamps.map((_, i) => (
          <div
            key={i}
            className='flex items-center justify-center'
            style={{ transform: "rotate(-35deg)" }}
          >
            <span
              className='select-none whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-black/8'
              style={{ color: "rgba(0,0,0,0.07)" }}
            >
              PREVIEW ONLY
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Letter render ─────────────────────────────────────────────────────────────

function LetterRender({ preview }: { preview: StudentLetterPreview }) {
  const snap = preview.recommenderSnapshot as RecommenderForm | null;

  return (
    <div className='relative bg-white font-serif text-gray-800'>
      <WatermarkOverlay />

      {/* Letterhead */}
      <div className='flex items-start justify-between gap-4 border-b border-dashed border-black/10 pb-4'>
        <div className='flex items-start gap-4'>
          {preview.logoSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.logoSignedUrl}
              alt='Institution logo'
              className='h-16 w-28 object-contain'
            />
          ) : (
            <div className='flex h-16 w-28 items-center justify-center rounded border border-dashed border-black/10 text-[9px] uppercase text-gray-400'>
              Logo
            </div>
          )}
          <div className='space-y-0.5'>
            <p className='text-sm font-semibold text-green-900'>
              {snap?.department ?? ""}
            </p>
            <p className='text-xs text-gray-500'>{snap?.organization ?? ""}</p>
          </div>
        </div>
        <div className='text-right text-xs text-gray-500 leading-relaxed'>
          <p>{snap?.street ?? ""}</p>
          <p>
            {[snap?.city, snap?.state, snap?.postalCode]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p>{snap?.country ?? ""}</p>
          {snap?.email && <p className='mt-1'>{snap.email}</p>}
          {snap?.phone && <p>{snap.phone}</p>}
        </div>
      </div>

      {/* Body */}
      {preview.html ? (
        <div
          className='mt-6 space-y-3 text-sm leading-relaxed text-gray-700'
          dangerouslySetInnerHTML={{ __html: preview.html }}
        />
      ) : (
        <p className='mt-6 text-sm text-gray-400'>No letter content.</p>
      )}

      {/* Sign-off + signature */}
      <div className='mt-8 flex flex-col items-start gap-2'>
        <p className='text-sm text-gray-600'>{snap?.signOff ?? "Sincerely,"}</p>
        {preview.signatureSignedUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.signatureSignedUrl}
            alt='Signature'
            className='h-12 w-40 object-contain'
          />
        )}
        <p className='text-xs font-semibold text-gray-700'>
          {[snap?.prefix, snap?.firstName, snap?.lastName]
            .filter(Boolean)
            .join(" ")}
        </p>
        {snap?.title && (
          <p className='text-[11px] text-gray-500'>{snap.title}</p>
        )}
      </div>

      {/* Preview notice */}
      <div className='mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800'>
        <span className='font-semibold'>Preview only.</span> This is a
        watermarked copy for your reference. The official letter is sealed and
        will be delivered to institutions by your professor via ReadMyStudent.
      </div>
    </div>
  );
}

// ─── Dialog ────────────────────────────────────────────────────────────────────

export function LetterPreviewDialog({
  letterId,
  facultyName,
  previewEnabled,
}: {
  letterId: string;
  facultyName: string;
  previewEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<StudentLetterPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(
    async (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen || preview) return; // already loaded
      setLoading(true);
      setError(null);
      const result = await getStudentLetterPreview(letterId);
      if (result) {
        setPreview(result);
      } else {
        setError("Preview is unavailable. The professor may have disabled it.");
      }
      setLoading(false);
    },
    [letterId, preview],
  );

  if (!previewEnabled) {
    return (
      <Button
        size='sm'
        variant='outline'
        disabled
        title={`${facultyName} has not enabled preview for this letter.`}
        className='rounded-lg border-black/10 text-black/30'
      >
        <EyeOff className='mr-1.5 h-3.5 w-3.5' />
        Preview
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => void handleOpen(o)}>
      <DialogTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          className='rounded-lg border-green-900/30 text-green-900 hover:bg-green-900/5'
        >
          <Eye className='mr-1.5 h-3.5 w-3.5' />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className='flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl sm:max-w-[760px]'>
        <DialogHeader className='shrink-0'>
          <DialogTitle className='font-serif text-green-900'>
            Letter Preview — {facultyName}
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-1'>
          {loading && (
            <div className='flex items-center justify-center py-20 text-sm text-gray-400'>
              Loading preview…
            </div>
          )}
          {error && (
            <div className='rounded-xl bg-red-50 p-4 text-sm text-red-700'>
              ❌ {error}
            </div>
          )}
          {preview && (
            <div className='rounded-xl border border-black/5 bg-white p-8 shadow-sm'>
              <LetterRender preview={preview} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
