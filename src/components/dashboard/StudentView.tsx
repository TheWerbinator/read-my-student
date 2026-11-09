"use client";

import { useState, useEffect } from "react";
import {
  sendLetterRequest,
  getFinishedLetters,
  getPendingRequests,
} from "@/app/actions/letters";
import type { FinishedLetter, PendingRequest } from "@/app/actions/letters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { requestStatus } from "@/components/board/status";
import { SendToSchoolDialog } from "@/components/dashboard/SendToSchoolDialog";
import { LetterPreviewDialog } from "@/components/dashboard/LetterPreviewDialog";
import {
  BoardColumns,
  BoardEmpty,
  BoardRow,
  BoardSkeleton,
  BoardStrip,
  StatusFlap,
} from "@/components/dashboard/StatsCard";

// Column templates. On phones the row stacks: professor and status on line one.
const READY_COLS = "md:grid-cols-[7rem_minmax(0,1fr)_9rem_auto]";
const PENDING_COLS = "md:grid-cols-[7rem_minmax(0,1fr)_9rem]";
const DATE_CELL = "order-3 font-display text-base font-bold tabular-nums tracking-[0.06em] text-flap-dim md:order-none";

export function StudentView() {
  const [profEmail, setProfEmail] = useState("");
  const [courseContext, setCourseContext] = useState("");
  const [studentNote, setStudentNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<
    | { status: "requested" }
    | { status: "error"; error: string }
    | null
  >(null);

  const [finishedLetters, setFinishedLetters] = useState<FinishedLetter[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Show a toast and clean the URL if returning from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      toast.success("Payment successful! Your professor has been notified and your delivery link has been generated.");
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment cancelled. No charge was made.");
    }
    if (paymentStatus) {
      params.delete("payment");
      const newUrl = [window.location.pathname, params.toString()].filter(Boolean).join("?");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const [finished, pending] = await Promise.all([
        getFinishedLetters(),
        getPendingRequests(),
      ]);
      setFinishedLetters(finished);
      setPendingRequests(pending);
      setDataLoading(false);
    }
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    const res = await sendLetterRequest({
      professorEmail: profEmail,
      courseContext: courseContext || undefined,
      studentNote: studentNote || undefined,
    });

    setResult(res.status === "error" ? res : { status: res.status });

    if (res.status !== "error") {
      setProfEmail("");
      setCourseContext("");
      setStudentNote("");
      // Refresh pending list
      const pending = await getPendingRequests();
      setPendingRequests(pending);
    }

    setIsLoading(false);
  };

  return (
    <div className='grid grid-cols-1 gap-6 xl:grid-cols-12'>
      {/* LEFT COL: Request Form */}
      <div className='max-w-xl xl:col-span-4 xl:max-w-none'>
        <div className='sheet space-y-5 p-6'>
          <div className='space-y-1'>
            <h2 className='font-display text-xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'>
              Request a Letter
            </h2>
            <p className='text-sm text-ink-2'>
              Ask a professor for a recommendation.
            </p>
          </div>

          {result?.status === "requested" && (
            <div
              role='status'
              className='border border-sealed/40 bg-paper-2 p-3 text-sm text-sealed'
            >
              Request sent. We emailed your professor a link to answer.
              They do not need an account. If they do not answer within 7
              days, the request closes.
            </div>
          )}
          {result?.status === "error" && (
            <div
              role='alert'
              className='border border-declined/40 bg-paper-2 p-3 text-sm text-declined'
            >
              {(result as { status: "error"; error: string }).error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='prof-email' className='caption text-ink-2'>
                Professor&apos;s email
              </Label>
              <Input
                id='prof-email'
                type='email'
                required
                placeholder='professor@university.edu'
                value={profEmail}
                onChange={(e) => setProfEmail(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='course' className='caption text-ink-2'>
                Course / context (optional)
              </Label>
              <Input
                id='course'
                placeholder='e.g. BIO 101, Fall 2023'
                value={courseContext}
                onChange={(e) => setCourseContext(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='message' className='caption text-ink-2'>
                Personal note
              </Label>
              <Textarea
                id='message'
                placeholder="Hi Professor, I'm applying to graduate programs this year..."
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                className='min-h-[100px]'
              />
            </div>
            <Button
              type='submit'
              variant='gold'
              size='lg'
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? "Sending…" : "Send Request"}
            </Button>
          </form>
        </div>
      </div>

      {/* RIGHT COL: Status Tabs */}
      <div className='min-w-0 xl:col-span-8'>
        <Tabs defaultValue='completed' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='completed'>Ready to Send</TabsTrigger>
            <TabsTrigger value='pending'>Pending</TabsTrigger>
          </TabsList>

          {/* COMPLETED REQUESTS (Ready to send to schools) */}
          <TabsContent value='completed' className='mt-4'>
            <BoardStrip title='Ready to send'>
              <div role='table' aria-label='Letters ready to send'>
                <BoardColumns
                  cols={READY_COLS}
                  labels={["Date signed", "Professor", "Status", "Action"]}
                />
                <div role='rowgroup' className='space-y-1'>
                  {dataLoading ? (
                    <BoardSkeleton />
                  ) : finishedLetters.length === 0 ? (
                    <BoardEmpty title='No letters ready yet'>
                      A letter shows up here once a professor seals it. If you
                      have not asked anyone yet, send a request with the form.
                    </BoardEmpty>
                  ) : (
                    finishedLetters.map((letter) => (
                      <BoardRow key={letter.letterId} cols={READY_COLS}>
                        <span role='cell' className={DATE_CELL}>
                          {new Date(letter.finalizedAt).toLocaleDateString()}
                        </span>
                        <span
                          role='cell'
                          className='order-1 min-w-0 break-words font-semibold text-flap-ink md:order-none'
                        >
                          {letter.facultyName}
                        </span>
                        <span role='cell' className='order-2 justify-self-end md:order-none md:justify-self-start'>
                          <StatusFlap label='Sealed' lamp='done' />
                        </span>
                        <span
                          role='cell'
                          className='order-4 col-span-2 flex flex-wrap items-center gap-2 pt-1 md:order-none md:col-span-1 md:justify-end md:pt-0'
                        >
                          <LetterPreviewDialog
                            letterId={letter.letterId}
                            facultyName={letter.facultyName}
                            previewEnabled={letter.studentPreviewEnabled}
                          />
                          <SendToSchoolDialog letterId={letter.letterId} />
                        </span>
                      </BoardRow>
                    ))
                  )}
                </div>
              </div>
            </BoardStrip>
          </TabsContent>

          {/* PENDING REQUESTS */}
          <TabsContent value='pending' className='mt-4'>
            <BoardStrip title='Pending requests'>
              <div role='table' aria-label='Pending requests'>
                <BoardColumns
                  cols={PENDING_COLS}
                  labels={["Sent on", "Professor", "Status"]}
                />
                <div role='rowgroup' className='space-y-1'>
                  {dataLoading ? (
                    <BoardSkeleton />
                  ) : pendingRequests.length === 0 ? (
                    <BoardEmpty title='No open requests'>
                      Enter a professor&apos;s email in the form to send your
                      first request. They answer from an emailed link, no
                      account needed.
                    </BoardEmpty>
                  ) : (
                    pendingRequests.map((req) => {
                      const s = requestStatus[req.status] ?? {
                        label: req.status,
                        lamp: "moving" as const,
                      };
                      return (
                        <BoardRow key={req.requestId} cols={PENDING_COLS}>
                          <span role='cell' className={DATE_CELL}>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            role='cell'
                            className='order-1 min-w-0 break-words text-flap-ink md:order-none'
                          >
                            {req.facultyEmail}
                          </span>
                          <span role='cell' className='order-2 justify-self-end md:order-none md:justify-self-start'>
                            <StatusFlap label={s.label} lamp={s.lamp} />
                          </span>
                        </BoardRow>
                      );
                    })
                  )}
                </div>
              </div>
            </BoardStrip>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
