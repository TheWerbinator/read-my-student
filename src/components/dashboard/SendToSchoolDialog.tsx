"use client";

import { useState, useEffect } from "react";
import { School } from "lucide-react";
import { requestDelivery } from "@/app/actions/letters";
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

const LS_KEY = "rms_recent_schools";
const MAX_RECENT = 5;

type RecentSchool = { name: string; email: string };

function loadRecentSchools(): RecentSchool[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as RecentSchool[]).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecentSchool(school: RecentSchool): void {
  try {
    const existing = loadRecentSchools();
    const filtered = existing.filter(
      (s) => s.email.toLowerCase() !== school.email.toLowerCase(),
    );
    const updated = [school, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore localStorage errors */
  }
}

export function SendToSchoolDialog({ letterId }: { letterId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([]);

  useEffect(() => {
    if (isOpen) setRecentSchools(loadRecentSchools());
  }, [isOpen]);

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSchoolName("");
      setSchoolEmail("");
      setError(null);
      setSent(false);
    }
  };

  const isValid =
    schoolName.trim().length > 0 && schoolEmail.trim().includes("@");

  const handleSend = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestDelivery(letterId, { schoolName, schoolEmail });
      if (result.error) {
        setError(result.error);
        return;
      }
      saveRecentSchool({ name: schoolName.trim(), email: schoolEmail.trim() });
      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='h-11 bg-transparent text-flap-ink ring-flap-ink/40 hover:bg-flap hover:text-flap-ink hover:ring-flap-ink/70'
        >
          <School /> Send to School
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='font-display text-xl font-extrabold uppercase tracking-[0.04em] text-forest-ink'>
            {sent ? "Waiting for your professor" : "Send Recommendation"}
          </DialogTitle>
          <DialogDescription>
            {sent
              ? `We emailed your professor to approve sending the letter to ${schoolName.trim()}. The school gets a secure link only after they approve.`
              : "Enter the admissions office's details. Your professor approves each school before the letter is sent."}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <DialogFooter>
            <Button type='button' variant='gold' size='lg' className='w-full' onClick={() => handleClose(false)}>
              Done
            </Button>
          </DialogFooter>
        ) : (
          <>
            <div className='grid gap-4 py-4'>
              {recentSchools.length > 0 && (
                <div className='grid gap-1'>
                  <p className='caption text-ink-2'>Previously sent to</p>
                  <div className='flex flex-wrap gap-1.5'>
                    {recentSchools.map((s) => (
                      <button
                        key={s.email}
                        type='button'
                        onClick={() => {
                          setSchoolName(s.name);
                          setSchoolEmail(s.email);
                        }}
                        disabled={isLoading}
                        className='min-h-11 rounded-[2px] border border-rule bg-paper-2 px-3 text-sm text-ink hover:border-forest hover:bg-white transition-colors disabled:opacity-50'
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className='grid gap-2'>
                <Label htmlFor='school-name' className='caption text-ink-2'>
                  Institution name
                </Label>
                <Input
                  id='school-name'
                  placeholder='e.g. University of Example'
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='school-email' className='caption text-ink-2'>
                  Admissions email
                </Label>
                <Input
                  id='school-email'
                  type='email'
                  placeholder='admissions@university.edu'
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValid) void handleSend();
                  }}
                />
              </div>

              {error && (
                <p role='alert' className='border border-declined/40 bg-paper-2 px-3 py-2 text-sm text-declined'>
                  {error}
                </p>
              )}

              <div className='border border-rule bg-paper-2 p-3 text-sm text-ink-2'>
                Your professor sees the school name and this email address
                before approving. Once approved, the school receives a secure
                link that works for 48 hours.
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='gold'
                size='lg'
                className='w-full'
                disabled={!isValid || isLoading}
                onClick={() => void handleSend()}
              >
                {isLoading ? "Sending…" : "Send for approval"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
