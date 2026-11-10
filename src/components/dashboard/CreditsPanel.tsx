"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Coins } from "lucide-react";
import type { ForSale, Wallet } from "@/app/actions/credits";
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
import {
  BoardColumns,
  BoardEmpty,
  BoardRow,
  BoardSkeleton,
  BoardStrip,
  StatsCard,
  StatusFlap,
} from "@/components/dashboard/StatsCard";
import { formatDate } from "@/lib/format-date";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const COLS = "md:grid-cols-[6.5rem_minmax(0,1fr)_8rem_9rem]";

const SOURCE_LABEL: Record<string, string> = {
  free_allocation: "Free credits",
  membership: "Membership",
  credits: "Extra credits",
  bundle: "Credit pack",
  adjustment: "Adjustment",
};

const STAGE_LABEL = { hs: "High school", ug: "Undergraduate", masters: "Master's", phd: "PhD" };

function itemTitle(item: ForSale): string {
  if (item.kind === "membership") return `Year ${item.studyYear} membership: ${item.credits} credits`;
  if (item.kind === "bundle") return `Pack of ${item.credits} credits`;
  return item.credits === 1 ? "Extra credit" : `${item.credits} extra credits`;
}

/** Balance, grant history (BRD 5.3), and the items the student can buy. */
export function CreditsPanel({ wallet }: { wallet: Wallet | null | undefined }) {
  if (wallet === null) return null;
  if (wallet?.status === "no_stage") {
    return (
      <BoardStrip title='Credits'>
        <BoardEmpty title='Year in school not set'>
          Your account was made before we asked for your stage and year in
          school, and we need them to give you credits. Contact support and we
          will set them for you.
        </BoardEmpty>
      </BoardStrip>
    );
  }

  return (
    <BoardStrip
      title='Credits'
      description={
        wallet
          ? `${STAGE_LABEL[wallet.stage]}${wallet.year ? `, Year ${wallet.year}` : ""}. Each request to a professor uses one credit. A declined or unanswered request gives it back.`
          : undefined
      }
      counts={
        wallet && (
          <StatsCard
            title='Balance'
            value={String(wallet.balance)}
            icon={Coins}
            lamp={wallet.balance > 0 ? "done" : "waiting"}
          />
        )
      }
    >
      {!wallet ? (
        <BoardSkeleton rows={2} />
      ) : (
        <>
          <div role='table' aria-label='Your credits'>
            <BoardColumns cols={COLS} labels={["Added", "From", "Left", "Expires"]} />
            <div role='rowgroup' className='space-y-1'>
              {wallet.grants.length === 0 ? (
                <BoardEmpty title='No credits yet'>Buy credits below to send your first request.</BoardEmpty>
              ) : (
                wallet.grants.map((g) => (
                  <BoardRow key={g.id} cols={COLS}>
                    <span role='cell' className='order-3 text-sm tabular-nums text-flap-dim md:order-none'>
                      {formatDate(g.createdAt)}
                    </span>
                    <span role='cell' className='order-1 font-semibold text-flap-ink md:order-none'>
                      {SOURCE_LABEL[g.source] ?? g.source}
                    </span>
                    <span role='cell' className='order-2 justify-self-end md:order-none md:justify-self-start'>
                      <StatusFlap
                        label={`${Math.max(g.left, 0)} OF ${g.quantity}`}
                        lamp={g.expired || g.left <= 0 ? "waiting" : "done"}
                      />
                    </span>
                    <span role='cell' className='order-4 text-sm text-flap-dim md:order-none'>
                      {g.expiresAt ? `${g.expired ? "Expired" : "Ends"} ${formatDate(g.expiresAt)}` : "Never"}
                    </span>
                  </BoardRow>
                ))
              )}
            </div>
          </div>

          <div className='mt-3 flex flex-wrap gap-2 px-2'>
            {wallet.forSale.map((item) => (
              <BuyDialog key={item.id} item={item} />
            ))}
            {wallet.hasMembership && <ManageButton />}
          </div>
        </>
      )}
    </BoardStrip>
  );
}

function BuyDialog({ item }: { item: ForSale }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [consent, setConsent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const membership = item.kind === "membership";
  const many = item.kind === "credits";
  const ready = (!membership || consent) && (!many || (quantity >= 1 && quantity <= 100));

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuantity(1);
      setConsent(false);
      setClientSecret(null);
      setError(null);
    }
  };

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: item.id,
          quantity: many ? quantity : 1,
          autoRenewConsent: membership ? consent : undefined,
        }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) setError(data.error ?? "Checkout could not start. Try again.");
      else setClientSecret(data.clientSecret);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const fetchClientSecret = useCallback(() => Promise.resolve(clientSecret ?? ""), [clientSecret]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='h-11 bg-transparent text-flap-ink ring-flap-ink/40 hover:bg-flap hover:text-flap-ink hover:ring-flap-ink/70'
        >
          {itemTitle(item)} · {item.price}
          {many ? " each" : membership ? " a year" : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className={clientSecret ? "sm:max-w-[520px]" : "sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle className='font-display text-xl font-extrabold uppercase tracking-[0.04em] text-forest-ink'>
            {itemTitle(item)}
          </DialogTitle>
          <DialogDescription>
            {membership
              ? `${item.price} for Year ${item.studyYear}. The credits are added when the payment goes through.`
              : `${item.price}${many ? " per credit" : ""}. The credits are added when the payment goes through.`}
          </DialogDescription>
        </DialogHeader>

        {clientSecret ? (
          <div className='py-2'>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          <>
            <div className='grid gap-4 py-2'>
              {many && (
                <div className='grid gap-2'>
                  <Label htmlFor={`qty-${item.id}`} className='caption text-ink-2'>
                    How many credits (1 to 100)
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    type='number'
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.floor(Number(e.target.value)))}
                  />
                </div>
              )}
              {membership && (
                // BRD PAY-05: explicit consent before recurring billing.
                <label className='flex items-start gap-3 text-sm text-ink'>
                  <input
                    type='checkbox'
                    className='mt-0.5 size-5 shrink-0 accent-forest'
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I agree that this membership renews automatically each year,
                    charged at the price for my next year in school, until I
                    cancel. I can cancel at any time from my dashboard.
                  </span>
                </label>
              )}
              {error && (
                <p role='alert' className='border border-declined/40 bg-paper-2 px-3 py-2 text-sm text-declined'>
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='gold'
                size='lg'
                className='w-full'
                disabled={!ready || loading}
                onClick={() => void start()}
              >
                {loading ? "Preparing payment…" : "Continue to payment"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManageButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) window.location.assign(data.url);
      else setError(data.error ?? "Could not open billing. Try again.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className='flex flex-col gap-1'>
      <Button
        variant='outline'
        disabled={loading}
        onClick={() => void open()}
        className='h-11 bg-transparent text-flap-ink ring-flap-ink/40 hover:bg-flap hover:text-flap-ink hover:ring-flap-ink/70'
      >
        {loading ? "Opening…" : "Manage or cancel membership"}
      </Button>
      {error && (
        <span role='alert' className='text-sm text-declined'>
          {error}
        </span>
      )}
    </span>
  );
}
