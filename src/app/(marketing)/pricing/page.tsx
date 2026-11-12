import { headers } from "next/headers";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { adminDb } from "@/lib/admin";
import { pricingRows } from "@/lib/billing";
import { CATALOG_COLUMNS, type CatalogRow } from "@/lib/catalog";
import { DEPENDENT_FREE_YEARS } from "@/lib/dependents";

export const metadata = {
  title: "Pricing and Free Letter Credits",
  description:
    "Recommendation letter requests with free credits for high school students every year, and free requests for professors' children for 3 years. Sending letters to schools is always free. Pay as you go or save with a yearly membership.",
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

const STAGES = [
  { key: "hs", label: "High school" },
  { key: "ug", label: "Undergraduate" },
  { key: "masters", label: "Master's" },
  { key: "phd", label: "PhD or working professional" },
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
  const sheets = STAGES.map((s) => ({
    ...s,
    rows: pricingRows(rows.filter((r) => r.stage === s.key), country),
  })).filter((s) => s.rows.length > 0);
  return { sheets, freebies: freebies(rows) };
}

type Freebie = { who: string; title: string; body: string };

/** The free offers, with counts from the live catalog so the page never promises a number the catalog does not give. */
function freebies(rows: CatalogRow[]): Freebie[] {
  const hs = rows.find((r) => r.stage === "hs" && r.kind === "free_allocation" && r.study_year === null);
  const ugYears = rows
    .filter((r) => r.stage === "ug" && r.kind === "membership" && r.free_credits > 0)
    .map((r) => r.study_year as number);
  return [
    ...(hs
      ? [{
          who: "High school students",
          title: `${hs.credits} free letter requests every year`,
          body: `Sign up in high school and get ${hs.credits} free credits each year you are with us. One credit asks one teacher or counselor for a letter. You do not need a card or a membership.`,
        }]
      : []),
    {
      who: "Faculty families",
      title: `Free for ${DEPENDENT_FREE_YEARS} years`,
      body: `Children and dependents of professors send every letter request free for ${DEPENDENT_FREE_YEARS} years. The professor sends us a message, and we email the invite.`,
    },
    ...(ugYears.length
      ? [{
          who: "Undergraduates",
          title: "Free credits every year",
          body: `Free credits each year in Years ${Math.min(...ugYears)} to ${Math.max(...ugYears)}, with or without a membership. The number for your year is on your line below.`,
        }]
      : []),
    {
      who: "Every student",
      title: "Free to send, to every school",
      body: "Once your letter is sealed, send it to as many schools as you apply to. Each one costs nothing.",
    },
    {
      who: "Every student",
      title: "Your credit comes back",
      body: "If a professor declines or does not answer in 7 days, the credit returns to your balance. You only pay for letters that happen.",
    },
    {
      who: "Professors and schools",
      title: "Always free",
      body: "Professors write and seal letters without paying or making an account. Schools open and download them for free.",
    },
  ];
}

export default async function PricingPage() {
  const { sheets, freebies } = await priceSheets();

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
            schools is free, professors never pay, and high school students get
            free credits every year.
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

      <section aria-labelledby='free-heading' className='px-5 py-12 md:px-8 md:py-20'>
        <div className='mx-auto max-w-6xl'>
          <h2
            id='free-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
          >
            What is <span className='text-mint'>free.</span>
          </h2>
          <p className='mt-4 max-w-2xl text-base leading-relaxed text-flap-dim'>
            Free recommendation letter requests for high school students and
            professors&apos; families, and free sending for every student. Some
            students never pay at all.
          </p>
          <div className='mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {freebies.map((f) => (
              <section key={f.title} className='sheet px-6 py-5'>
                <p className='caption text-ink-2'>{f.who}</p>
                <h3 className='mt-2 font-display text-2xl font-bold uppercase leading-tight tracking-[0.04em] text-forest-ink'>
                  {f.title}
                </h3>
                <p className='mt-2 text-base leading-relaxed text-ink-2'>{f.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby='plans-heading' className='px-5 py-12 md:px-8 md:py-20'>
        <div className='mx-auto max-w-6xl'>
          <h2
            id='plans-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
          >
            Pay as you go, or save by the year.
          </h2>
          <p className='mt-4 max-w-2xl text-base leading-relaxed text-flap-dim'>
            Need a letter or two? Buy single credits as you go, with no
            membership. Asking several professors this year? A yearly membership
            costs less per credit. You pick your stage and year when you sign
            up, and your year goes up each year on the date you joined.
            Memberships renew each year at the price for your next year until
            you cancel.{" "}
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
            <div className='mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
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
