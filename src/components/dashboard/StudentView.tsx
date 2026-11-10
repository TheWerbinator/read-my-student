"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  sendLetterRequest,
  getFinishedLetters,
  getPendingRequests,
} from "@/app/actions/letters";
import type { FinishedLetter, PendingRequest } from "@/app/actions/letters";
import { getWallet, type Wallet } from "@/app/actions/credits";
import { CreditsPanel } from "@/components/dashboard/CreditsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { letterStop, requestStop } from "@/components/dashboard/stops";
import dynamic from "next/dynamic";
import { formatDate } from "@/lib/format-date";

// The dialogs (the school form, html2canvas) load in their own chunks, not with the dashboard.
const holdSpace = () => <span aria-hidden='true' className='inline-block h-11 w-32' />;
const SendToSchoolDialog = dynamic(
  () => import("@/components/dashboard/SendToSchoolDialog").then((m) => m.SendToSchoolDialog),
  { loading: holdSpace },
);
const LetterPreviewDialog = dynamic(
  () => import("@/components/dashboard/LetterPreviewDialog").then((m) => m.LetterPreviewDialog),
  { loading: holdSpace },
);
import {
  BoardColumns,
  BoardEmpty,
  BoardRow,
  BoardSkeleton,
  BoardStrip,
  StatusFlap,
} from "@/components/dashboard/StatsCard";

// On phones the row stacks: professor and status on line one, date, then actions.
// Fixed status and action widths keep every row's columns aligned (each row is
// its own grid). Columns start at xl; below that, rows stack like on phones.
const COLS = "xl:grid-cols-[6.5rem_minmax(0,1fr)_11rem_18rem]";
const DATE_CELL = "order-3 font-display text-base font-bold tabular-nums tracking-[0.06em] text-flap-dim xl:order-none";


type BoardItem =
  | { kind: "letter"; id: string; date: string; letter: FinishedLetter }
  | { kind: "request"; id: string; date: string; req: PendingRequest };

export function StudentView() {
  const [profEmail, setProfEmail] = useState("");
  const [courseContext, setCourseContext] = useState("");
  const [studentNote, setStudentNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [result, setResult] = useState<
    | { status: "requested" }
    | { status: "error"; error: string }
    | null
  >(null);

  const [finishedLetters, setFinishedLetters] = useState<FinishedLetter[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  // undefined while loading.
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);

  // Show a toast and clean the URL if returning from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Credit purchases return with ?checkout=<session id>. The webhook adds the credits.
    if (params.has("checkout")) {
      toast.success("Payment received. Your credits appear here within a minute. Refresh the page if you do not see them.");
      params.delete("checkout");
      const newUrl = [window.location.pathname, params.toString()].filter(Boolean).join("?");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const [finished, pending, w] = await Promise.all([
        getFinishedLetters(),
        getPendingRequests(),
        getWallet(),
      ]);
      setFinishedLetters(finished);
      setPendingRequests(pending);
      setWallet(w);
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
      setFormOpen(false);
      // Refresh the pending list and the balance the request spent from.
      const [pending, w] = await Promise.all([getPendingRequests(), getWallet()]);
      setPendingRequests(pending);
      setWallet(w);
    }

    setIsLoading(false);
  };

  // Completed requests come back as letters, never as pending, so nothing repeats.
  const items: BoardItem[] = [
    ...finishedLetters.map((letter): BoardItem => ({
      kind: "letter",
      id: letter.letterId,
      date: letter.finalizedAt,
      letter,
    })),
    ...pendingRequests.map((req): BoardItem => ({
      kind: "request",
      id: req.requestId,
      date: req.createdAt,
      req,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasItems = items.length > 0;
  const noCredits = wallet?.status === "no_stage" || (wallet?.status === "ok" && wallet.balance < 1);
  // With no requests yet the form is the next step, so it stays open.
  const showForm = !dataLoading && (!hasItems || formOpen);

  return (
    <div className='space-y-6'>
      <BoardStrip title='Your departures'>
        <div role='table' aria-label='Your requests and letters'>
          <BoardColumns
            cols={COLS}
            labels={["Date", "Professor", "Status", "Action"]}
            className='md:hidden xl:grid'
          />
          <div role='rowgroup' className='space-y-1'>
            {dataLoading ? (
              <BoardSkeleton />
            ) : !hasItems ? (
              <BoardEmpty title='No departures yet'>
                Send your first request below. Your professor gets one link by
                email and needs no account. A reminder goes out on day 3, and
                the request closes on day 7 if nobody answers. When the letter
                is sealed, send it to each school from here.
              </BoardEmpty>
            ) : (
              items.map((item) => {
                const s =
                  item.kind === "letter"
                    ? letterStop(item.letter)
                    : requestStop(item.req);
                return (
                  <BoardRow key={item.id} cols={COLS}>
                    <span role='cell' className={DATE_CELL}>
                      {formatDate(item.date)}
                    </span>
                    <span
                      role='cell'
                      className='order-1 min-w-0 break-words xl:order-none'
                    >
                      <span className='block font-semibold text-flap-ink'>
                        {item.kind === "letter"
                          ? item.letter.facultyName
                          : item.req.facultyEmail}
                      </span>
                      <span className='block text-sm text-flap-dim'>{s.note}</span>
                    </span>
                    <span role='cell' className='order-2 justify-self-end xl:order-none xl:justify-self-start'>
                      <StatusFlap label={s.label} lamp={s.lamp} />
                    </span>
                    <span
                      role='cell'
                      className='order-4 col-span-2 flex flex-wrap items-center gap-2 pt-1 empty:hidden xl:order-none xl:col-span-1 xl:justify-end xl:pt-0 xl:empty:block'
                    >
                      {item.kind === "letter" && (
                        <>
                          <LetterPreviewDialog
                            letterId={item.letter.letterId}
                            facultyName={item.letter.facultyName}
                            previewEnabled={item.letter.studentPreviewEnabled}
                          />
                          <SendToSchoolDialog letterId={item.letter.letterId} />
                        </>
                      )}
                    </span>
                  </BoardRow>
                );
              })
            )}
          </div>
        </div>

        {!dataLoading && hasItems && (
          <button
            type='button'
            aria-expanded={formOpen}
            aria-controls='new-request'
            onClick={() => setFormOpen((o) => !o)}
            className='flap-row mt-1 flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left font-display text-lg font-bold uppercase tracking-[0.06em] text-gold focus-visible:outline-2 focus-visible:outline-gold'
          >
            <span className='flex items-center gap-2'>
              <Plus className='size-4' aria-hidden='true' />
              New request
            </span>
            <ChevronDown
              className={`size-4 transition-transform motion-reduce:transition-none ${formOpen ? "rotate-180" : ""}`}
              aria-hidden='true'
            />
          </button>
        )}
      </BoardStrip>

      <CreditsPanel wallet={wallet} />

      {result?.status === "requested" && (
        <div
          role='status'
          className='sheet border border-sealed/40 p-3 text-sm text-sealed'
        >
          Request sent. We emailed your professor a link to answer.
          They do not need an account. If they do not answer within 7
          days, the request closes.
        </div>
      )}

      {showForm && (
        <div id='new-request' className='sheet max-w-xl space-y-5 p-6'>
          <div className='space-y-1'>
            <h2 className='font-display text-xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'>
              Request a Letter
            </h2>
            <p className='text-sm text-ink-2'>
              Ask a professor for a recommendation.
            </p>
          </div>

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
            {noCredits && (
              <p className='border border-rule bg-paper-2 p-3 text-sm text-ink-2'>
                {wallet?.status === "no_stage"
                  ? "Requests need your year in school, which is not set on your account. Contact support."
                  : "You have no credits left. Each request uses one. Buy credits in the Credits panel above."}
              </p>
            )}
            <Button
              type='submit'
              variant='gold'
              size='lg'
              disabled={isLoading || noCredits}
              className='w-full'
            >
              {isLoading ? "Sending…" : "Send Request (1 credit)"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
