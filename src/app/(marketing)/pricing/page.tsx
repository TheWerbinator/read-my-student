import { headers } from "next/headers";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { adminDb } from "@/lib/admin";
import { pricingRow, type PricingRow } from "@/lib/billing";
import { CATALOG_COLUMNS, type CatalogRow } from "@/lib/catalog";

export const metadata = {
  title: "Pricing",
  description:
    "One credit pays for one request to one professor, and it comes back if they decline or do not answer. Sending the letter to your schools is free. Professors never pay.",
};

const fares = [
  { who: "Student", what: "Asking one professor for a letter", fare: "1 credit" },
  { who: "Student", what: "Sending the letter to each school", fare: "Free" },
  { who: "Professor", what: "Writing, signing, or declining", fare: "Free" },
  { who: "School", what: "Opening and downloading the letter", fare: "Free" },
];

const buys = [
  {
    title: "One professor",
    body: "A credit pays for one request to one professor. If they decline, or do not answer within 7 days, the credit goes back to your balance.",
  },
  {
    title: "Every school",
    body: "Once the letter is sealed, send it to as many schools as you apply to. Each school costs nothing.",
  },
  {
    title: "Its own secure link",
    body: "Each school gets a link that belongs to it alone, after your professor approves that school. The link works for 48 hours.",
  },
  {
    title: "An email check",
    body: "The reader confirms the school email address before the letter opens, and the first opening is logged.",
  },
];

// High school waits for the parental consent step (plan Phase 4).
const STAGES = [
  { key: "ug", label: "Undergraduate" },
  { key: "masters", label: "Master's" },
  { key: "phd", label: "PhD" },
] as const;

const ORDER: Record<CatalogRow["kind"], number> = { free_allocation: 0, membership: 1, credits: 2, bundle: 3 };

async function priceSheets() {
  const country = (await headers()).get("x-vercel-ip-country");
  const { data, error } = await adminDb()
    .from("plan_catalog")
    .select(CATALOG_COLUMNS)
    .in("stage", STAGES.map((s) => s.key))
    .eq("active", true);
  if (error) throw error;
  const rows = ((data ?? []) as CatalogRow[]).sort(
    (a, b) => ORDER[a.kind] - ORDER[b.kind] || (a.study_year ?? 0) - (b.study_year ?? 0),
  );
  return STAGES.map((s) => ({
    ...s,
    rows: rows
      .filter((r) => r.stage === s.key)
      .map((r) => pricingRow(r, country))
      .filter((r): r is PricingRow => r !== null),
  })).filter((s) => s.rows.some((r) => !r.free));
}

export default async function PricingPage() {
  const sheets = await priceSheets();

  return (
    <>
      <section className='px-5 pb-12 pt-8 md:px-8 md:pb-16 lg:pt-16'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            One credit. <span className='text-gold'>Per professor.</span>
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90 md:text-xl'>
            A credit pays for one letter request. If the professor says no or
            never answers, you get it back. Sending the finished letter to your
            schools is free, and professors never pay.
          </p>

          <figure className='board-frame mt-10 lg:max-w-4xl'>
            <figcaption className='px-2 pb-2 pt-1 font-display text-xl font-extrabold uppercase tracking-[0.08em] text-flap-ink'>
              Fare sheet
            </figcaption>
            <table className='w-full border-separate border-spacing-y-[3px] text-left tabular-nums'>
              <thead>
                <tr className='caption text-flap-dim'>
                  <th scope='col' className='px-2 pb-1 font-semibold'>Who</th>
                  <th scope='col' className='hidden px-2 pb-1 font-semibold sm:table-cell'>For</th>
                  <th scope='col' className='px-2 pb-1 text-right font-semibold'>Pays</th>
                </tr>
              </thead>
              <tbody className='font-display uppercase leading-none tracking-[0.06em]'>
                {fares.map((r) => {
                  const paid = r.fare !== 'Free';
                  return (
                    <tr key={r.who + r.what}>
                      <td className='flap-row rounded-l-[2px] px-2 py-3 align-top text-lg font-bold text-flap-ink sm:align-middle md:text-xl'>
                        {r.who}
                        <span className='mt-1 block text-sm font-semibold normal-case tracking-normal text-flap-dim sm:hidden'>
                          {r.what}
                        </span>
                      </td>
                      <td className='flap-row hidden px-2 py-3 text-base font-semibold normal-case tracking-normal text-flap-ink/90 sm:table-cell'>
                        {r.what}
                      </td>
                      <td
                        className={`flap-row whitespace-nowrap rounded-r-[2px] px-2 py-3 text-right align-top text-2xl font-extrabold sm:align-middle md:text-3xl ${paid ? 'text-gold' : 'text-mint'}`}
                      >
                        {r.fare}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </figure>
        </div>
      </section>

      <section aria-labelledby='plans-heading' className='px-5 py-12 md:px-8 md:py-20'>
        <div className='mx-auto max-w-6xl'>
          <h2
            id='plans-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
          >
            Credits by year in school.
          </h2>
          <p className='mt-4 max-w-2xl text-base leading-relaxed text-flap-dim'>
            You pick your stage and year when you sign up, and your year goes up
            each year on the date you joined. Memberships renew each year at the
            price for your next year until you cancel.{" "}
            <Link href='/refunds' className='font-semibold text-flap-ink underline'>
              Refunds and cancellation
            </Link>
            .
          </p>

          {sheets.length === 0 ? (
            <div className='board-frame mt-8 lg:max-w-4xl'>
              <p className='flap-row px-4 py-6 font-display text-lg font-bold uppercase tracking-[0.06em] text-flap-ink'>
                Prices are being set. Check back soon.
              </p>
            </div>
          ) : (
            <div className='mt-8 grid gap-6 lg:grid-cols-3'>
              {sheets.map((s) => (
                <section key={s.key} aria-label={`${s.label} prices`} className='sheet px-6 py-3'>
                  <h3 className='pt-3 font-display text-2xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
                    {s.label}
                  </h3>
                  <dl className='divide-y divide-rule'>
                    {s.rows.map((r) => (
                      <div key={r.id} className='py-4'>
                        <div className='flex items-baseline justify-between gap-4'>
                          <dt className='font-semibold text-ink'>{r.label}</dt>
                          <dd className='whitespace-nowrap font-display text-lg font-bold tabular-nums text-forest-ink'>
                            {r.price}
                          </dd>
                        </div>
                        <p className='mt-1 text-sm text-ink-2'>{r.detail}</p>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby='buys-heading' className='px-5 py-12 md:px-8 md:py-20'>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <h2
            id='buys-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl lg:col-span-5'
          >
            What a credit buys.
          </h2>
          <div className='sheet px-6 py-3 md:px-10 lg:col-span-7'>
            <dl className='divide-y divide-rule'>
              {buys.map((b) => (
                <div key={b.title} className='grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6'>
                  <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>{b.title}</dt>
                  <dd className='text-base leading-relaxed text-ink-2'>{b.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className='px-5 pb-20 pt-4 md:px-8 md:pb-28'>
        <div className='mx-auto flex max-w-6xl flex-col items-start gap-6 border-t border-flap pt-10 md:flex-row md:items-center md:justify-between'>
          <p className='max-w-md font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em]'>
            Professors owe nothing.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <LinkButton href='/signup?role=student' variant='gold' size='lg'>
              Request a letter
            </LinkButton>
            <LinkButton href='/for-faculty' variant='board' size='lg'>
              I am a professor
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
