"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, FileText, ShieldCheck, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  BoardColumns,
  BoardEmpty,
  BoardRow,
  BoardSkeleton,
  BoardStrip,
  StatsCard,
  StatusFlap,
} from "@/components/dashboard/StatsCard";
import dynamic from "next/dynamic";
import { formatDate } from "@/lib/format-date";

// The writer (Lexical editor) loads in its own chunk, not with the dashboard.
const WriteLetterDialog = dynamic(
  () => import("@/components/dashboard/WriteLetterDialog").then((m) => m.WriteLetterDialog),
  { loading: () => <span aria-hidden='true' className='inline-block h-11 w-32' /> },
);
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  getPendingDeliveries,
  getFacultyRequests,
  getFacultyFinalizedLetters,
  approveDelivery,
  rejectDelivery,
  rejectLetterRequest,
  setStudentPreviewEnabled,
  type PendingDelivery,
  type FacultyLetterRequest,
  type FacultyFinalizedLetter,
} from "@/app/actions/letters";
import { getFacultyProfile, saveFacultyProfile, getSignedAssetUrl } from "@/app/actions/faculty";
import type { FacultyProfileRow, RecommenderForm } from "@/lib/faculty-profile";
import { dbRowToProfile } from "@/lib/faculty-profile";

// Five columns on desktop. On phones the row stacks: student and status on line one.
const ROW_COLS = "md:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_9rem_auto]";
const DATE_CELL = "order-3 font-display text-base font-bold tabular-nums tracking-[0.06em] text-flap-dim md:order-none";
const NAME_CELL = "order-1 min-w-0 break-words font-semibold text-flap-ink md:order-none";
const STATUS_CELL = "order-2 justify-self-end md:order-none md:justify-self-start";
const MID_CELL = "order-4 col-span-2 min-w-0 break-words text-sm text-flap-dim md:order-none md:col-span-1";
const ACTION_CELL = "order-5 col-span-2 flex flex-wrap items-center gap-2 pt-1 md:order-none md:col-span-1 md:justify-end md:pt-0";
// Row buttons sit on the dark board; 44px tall for touch.
const BOARD_BTN = "h-11 bg-transparent text-flap-ink ring-flap-ink/40 hover:bg-flap hover:text-flap-ink hover:ring-flap-ink/70";

export function FacultyView() {
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>(
    [],
  );
  const [letterRequests, setLetterRequests] = useState<FacultyLetterRequest[]>(
    [],
  );
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [facultyProfile, setFacultyProfile] =
    useState<FacultyProfileRow | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);
  const [savedLogoStoragePath, setSavedLogoStoragePath] = useState<string | null>(null);
  const [savedSignatureStoragePath, setSavedSignatureStoragePath] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authFirstName, setAuthFirstName] = useState<string | null>(null);
  const [authLastName, setAuthLastName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reject request dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Verification settings dialog
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [finalizedLetters, setFinalizedLetters] = useState<
    FacultyFinalizedLetter[]
  >([]);
  const [loadingFinalized, setLoadingFinalized] = useState(false);
  const [previewToggles, setPreviewToggles] = useState<Record<string, boolean>>(
    {},
  );

  function openVerificationDialog() {
    setVerificationDialogOpen(true);
    if (finalizedLetters.length === 0) {
      setLoadingFinalized(true);
      getFacultyFinalizedLetters().then((letters) => {
        setFinalizedLetters(letters);
        setPreviewToggles(
          Object.fromEntries(
            letters.map((l) => [l.letterId, l.studentPreviewEnabled]),
          ),
        );
        setLoadingFinalized(false);
      });
    }
  }

  async function handleTogglePreview(letterId: string, enabled: boolean) {
    setPreviewToggles((prev) => ({ ...prev, [letterId]: enabled }));
    await setStudentPreviewEnabled(letterId, enabled);
  }

  useEffect(() => {
    getPendingDeliveries()
      .then(setPendingDeliveries)
      .finally(() => setLoadingDeliveries(false));

    getFacultyRequests()
      .then(setLetterRequests)
      .finally(() => setLoadingRequests(false));

    getFacultyProfile().then(async (profile) => {
      setFacultyProfile(profile);
      if (profile?.logo_storage_path) {
        setSavedLogoStoragePath(profile.logo_storage_path);
        getSignedAssetUrl(profile.logo_storage_path, "logo").then(setSavedLogoUrl);
      }
      if (profile?.signature_storage_path) {
        setSavedSignatureStoragePath(profile.signature_storage_path);
        getSignedAssetUrl(profile.signature_storage_path, "signature").then(setSavedSignatureUrl);
      }
    });

    // Fetch auth email for profile autofill
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setAuthEmail(data.user.email);
      if (data.user?.user_metadata?.firstName)
        setAuthFirstName(data.user.user_metadata.firstName);
      if (data.user?.user_metadata?.lastName)
        setAuthLastName(data.user.user_metadata.lastName);
    });
  }, []);

  const handleApprove = (id: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await approveDelivery(id);
      if (result.error) {
        setActionError(result.error);
      } else {
        setPendingDeliveries((prev) =>
          prev.filter((d) => d.deliveryLinkId !== id),
        );
      }
    });
  };

  const handleReject = (id: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await rejectDelivery(id);
      if (result.error) {
        setActionError(result.error);
      } else {
        setPendingDeliveries((prev) =>
          prev.filter((d) => d.deliveryLinkId !== id),
        );
      }
    });
  };

  const handleSaveProfile = async (form: RecommenderForm) => {
    return saveFacultyProfile(form);
  };

  const openRejectDialog = (requestId: string) => {
    setRejectingRequestId(requestId);
    setRejectReason("");
    setRejectError(null);
    setRejectDialogOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!rejectingRequestId) return;
    setIsRejecting(true);
    setRejectError(null);
    const result = await rejectLetterRequest(rejectingRequestId, rejectReason);
    if (result.error) {
      setRejectError(result.error);
    } else {
      setLetterRequests((prev) =>
        prev.filter((r) => r.requestId !== rejectingRequestId),
      );
      setRejectDialogOpen(false);
    }
    setIsRejecting(false);
  };

  return (
    <>
      {/* A notice, not a document: board inks, so paper stays reserved for letters and forms. */}
      <div className='flex flex-col gap-3 border-y border-flap py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <ShieldCheck className='mt-0.5 size-5 shrink-0 text-mint' aria-hidden='true' />
          <div>
            <p className='font-display text-lg font-bold uppercase leading-none tracking-[0.06em] text-flap-ink'>
              Secure letter workflow
            </p>
            <p className='mt-1.5 max-w-[65ch] text-sm text-flap-dim'>
              Students never see letter contents unless you turn on a preview.
              Finalized letters are sealed and signed for verification.
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          className={`${BOARD_BTN} shrink-0`}
          onClick={openVerificationDialog}
        >
          Student Preview Settings
        </Button>
      </div>

      {/* Incoming requests */}
      <BoardStrip
        title='Incoming requests'
        description='Students requesting a letter of recommendation.'
        counts={
          <>
            <StatsCard
              title='Incoming'
              value={loadingRequests ? "--" : String(letterRequests.length)}
              icon={FileText}
              lamp='moving'
            />
            <StatsCard
              title='Avg. response time'
              value={null}
              note='Shown after your first letter'
              icon={Timer}
            />
          </>
        }
      >
        <div role='table' aria-label='Incoming requests'>
          <BoardColumns
            cols={ROW_COLS}
            labels={["Requested", "Student", "Class / context", "Status", "Action"]}
          />
          <div role='rowgroup' className='space-y-1'>
            {loadingRequests ? (
              <BoardSkeleton />
            ) : letterRequests.length === 0 ? (
              <BoardEmpty title='No requests waiting'>
                When a student asks you for a letter, it appears here. You can
                write it or decline it from this row.
              </BoardEmpty>
            ) : (
              letterRequests.map((req) => (
                <BoardRow key={req.requestId} cols={ROW_COLS}>
                  <span role='cell' className={DATE_CELL}>
                    {formatDate(req.createdAt)}
                  </span>
                  <span role='cell' className={NAME_CELL}>
                    {req.studentName}
                  </span>
                  <span role='cell' className={MID_CELL}>
                    {req.courseContext ?? "No context given"}
                  </span>
                  <span role='cell' className={STATUS_CELL}>
                    <StatusFlap label='Requested' lamp='moving' />
                  </span>
                  <span role='cell' className={ACTION_CELL}>
                    <WriteLetterDialog
                      studentName={req.studentName}
                      requestId={req.requestId}
                      savedProfile={
                        facultyProfile
                          ? dbRowToProfile(
                              facultyProfile,
                              authEmail,
                              authFirstName,
                              authLastName,
                            )
                          : undefined
                      }
                      savedLogoUrl={savedLogoUrl}
                      savedSignatureUrl={savedSignatureUrl}
                      savedLogoStoragePath={savedLogoStoragePath}
                      savedSignatureStoragePath={savedSignatureStoragePath}
                      onSaveProfile={handleSaveProfile}
                      onDraftSaved={() =>
                        getFacultyRequests().then(setLetterRequests)
                      }
                      onFinalized={() =>
                        getFacultyRequests().then(setLetterRequests)
                      }
                    />
                    <Button
                      variant='outline'
                      className={BOARD_BTN}
                      onClick={() => openRejectDialog(req.requestId)}
                    >
                      Decline
                    </Button>
                  </span>
                </BoardRow>
              ))
            )}
          </div>
        </div>
      </BoardStrip>

      {/* Pending delivery approvals */}
      {/* An empty approvals board collapses to one line; only Incoming stays full. */}
      {!loadingDeliveries && pendingDeliveries.length === 0 && !actionError ? (
        <div className='board-frame flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6'>
          <h2 className='font-display text-xl font-extrabold uppercase tracking-[0.04em] text-flap-ink'>
            Pending delivery approvals
          </h2>
          <p className='max-w-[65ch] text-sm text-flap-dim'>
            Nothing to approve. When a student sends your letter to a school,
            it waits here for you.
          </p>
        </div>
      ) : (
      <BoardStrip
        title='Pending delivery approvals'
        description='Students have paid to send your letter to a school. Review and approve or reject each request. The 48-hour delivery window starts only after you approve.'
        counts={
          <StatsCard
            title='Pending'
            value={loadingDeliveries ? "--" : String(pendingDeliveries.length)}
            icon={Clock}
            lamp={pendingDeliveries.length > 0 ? "waiting" : "moving"}
          />
        }
      >
        {actionError && (
          <p role='alert' className='mx-2 mb-3 text-sm text-signal'>
            {actionError}
          </p>
        )}
        <div role='table' aria-label='Pending delivery approvals'>
          <BoardColumns
            cols={ROW_COLS}
            labels={["Paid on", "Student", "Destination", "Status", "Action"]}
          />
          <div role='rowgroup' className='space-y-1'>
            {loadingDeliveries ? (
              <BoardSkeleton rows={2} />
            ) : pendingDeliveries.length === 0 ? (
              <BoardEmpty title='Nothing to approve'>
                When a student pays to send your letter to a school, the
                request waits here for your approval.
              </BoardEmpty>
            ) : (
              pendingDeliveries.map((d) => (
                <BoardRow key={d.deliveryLinkId} cols={ROW_COLS}>
                  <span role='cell' className={DATE_CELL}>
                    {formatDate(d.paidAt)}
                  </span>
                  <span role='cell' className={NAME_CELL}>
                    {d.studentFullName}
                  </span>
                  <span role='cell' className={MID_CELL}>
                    {d.schoolName}
                  </span>
                  <span role='cell' className={STATUS_CELL}>
                    <StatusFlap label='To approve' lamp='waiting' />
                  </span>
                  <span role='cell' className={ACTION_CELL}>
                    <Button
                      variant='gold'
                      className='h-11'
                      disabled={isPending}
                      onClick={() => handleApprove(d.deliveryLinkId)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant='outline'
                      className={BOARD_BTN}
                      disabled={isPending}
                      onClick={() => handleReject(d.deliveryLinkId)}
                    >
                      Reject
                    </Button>
                  </span>
                </BoardRow>
              ))
            )}
          </div>
        </div>
      </BoardStrip>
      )}

      {/* Student preview settings dialog */}
      <Dialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl font-extrabold uppercase tracking-[0.04em] text-forest-ink'>
              Student Preview Settings
            </DialogTitle>
            <DialogDescription>
              Control whether students can see a watermarked preview of their
              letter in their dashboard. Letters are cryptographically sealed at
              finalization, so students never receive an unsecured copy.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-1'>
            {loadingFinalized ? (
              <p className='py-6 text-center text-sm text-ink-2'>Loading…</p>
            ) : finalizedLetters.length === 0 ? (
              <p className='py-6 text-center text-sm text-ink-2'>
                No finalized letters yet. Once you seal a letter, you can turn
                on its student preview here.
              </p>
            ) : (
              finalizedLetters.map((letter) => (
                <div
                  key={letter.letterId}
                  className='flex items-center justify-between gap-4 border border-rule bg-paper-2 px-4 py-3'
                >
                  <div>
                    <p className='text-sm font-semibold text-ink'>
                      {letter.studentName}
                    </p>
                    <p className='text-xs text-ink-2'>
                      Finalized{" "}
                      {formatDate(letter.finalizedAt)}
                    </p>
                  </div>
                  <button
                    type='button'
                    role='switch'
                    aria-checked={previewToggles[letter.letterId] ?? false}
                    aria-label={`Student preview for ${letter.studentName}`}
                    onClick={() =>
                      handleTogglePreview(
                        letter.letterId,
                        !(previewToggles[letter.letterId] ?? false),
                      )
                    }
                    // The pseudo-element stretches the hit area to 44px.
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      (previewToggles[letter.letterId] ?? false)
                        ? "bg-forest"
                        : "bg-ink-2"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white ring-0 transition-transform motion-reduce:transition-none ${
                        (previewToggles[letter.letterId] ?? false)
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject request dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl font-extrabold uppercase tracking-[0.04em] text-forest-ink'>
              Decline Request
            </DialogTitle>
            <DialogDescription>
              The student will be notified by email. You can optionally include
              a brief message.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <Label htmlFor='reject-reason' className='caption text-ink-2'>
              Message to student (optional)
            </Label>
            <Textarea
              id='reject-reason'
              placeholder="e.g. I don't have capacity this semester..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className='min-h-[100px]'
            />
            {rejectError && (
              <p role='alert' className='text-sm text-declined'>
                {rejectError}
              </p>
            )}
          </div>
          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              className='h-11'
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='h-11'
              onClick={handleRejectRequest}
              disabled={isRejecting}
            >
              {isRejecting ? "Declining…" : "Decline Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
