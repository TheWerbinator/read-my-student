import { LinkButton } from "@/components/ui/LinkButton";

export const metadata = {
  title: "Pricing",
  description:
    "Requesting a letter is free and professors never pay. Students pay $5 USD each time they send a sealed letter to one school.",
};

const fares = [
  { who: "Student", what: "Each school you send a letter to", fare: "$5 USD" },
  { who: "Student", what: "Asking a professor for a letter", fare: "$0" },
  { who: "Professor", what: "Writing, signing, or declining", fare: "$0" },
  { who: "School", what: "Opening and downloading the letter", fare: "$0" },
];

const buys = [
  {
    title: "One school",
    body: "The fare covers one delivery to one school. Sending the same letter to a second school is a second fare.",
  },
  {
    title: "Its own secure link",
    body: "That school gets a link that belongs to it alone. Nobody else's link opens the letter.",
  },
  {
    title: "An email check",
    body: "The reader confirms the school email address before the letter opens.",
  },
  {
    title: "A logged opening",
    body: "The time the school first opens the letter is recorded. Your professor approves each delivery, and the link then stays valid for 48 hours.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className='px-5 pb-12 pt-8 md:px-8 md:pb-16 lg:pt-16'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            One fare. <span className='text-gold'>Per school.</span>
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90 md:text-xl'>
            Asking for a letter costs nothing. You pay $5 each time you send a sealed letter to a school. Professors never pay.
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
                  const paid = r.fare !== '$0';
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

          <p className='mt-5 text-base text-flap-dim'>Yearly plans are coming. Today you pay per school.</p>
        </div>
      </section>

      <section aria-labelledby='buys-heading' className='px-5 py-12 md:px-8 md:py-20'>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <h2
            id='buys-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl lg:col-span-5'
          >
            What the $5 buys.
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
