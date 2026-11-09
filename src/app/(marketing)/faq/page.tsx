import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

export const metadata = {
  title: "FAQ",
  description:
    "Short answers for students, professors, and schools: what a letter request costs, how a professor answers, and how a school opens a sealed letter.",
};

type FAQItem = { q: string; a: React.ReactNode };

const groups: { id: string; title: string; lead: string; items: FAQItem[] }[] = [
  {
    id: "students",
    title: "Students",
    lead: "You start the request and you send the letter.",
    items: [
      {
        q: "What does it cost?",
        a: (
          <>
            Asking a professor for a letter is free. You pay $5 USD each time you send a sealed letter to one school.{" "}
            <Link href='/pricing' className='text-forest underline'>
              See pricing
            </Link>
            .
          </>
        ),
      },
      {
        q: "How do I ask for a letter?",
        a: "Enter your professor's email, the course, and a personal note. Your professor gets an email with a link.",
      },
      {
        q: "What if my professor does not answer?",
        a: "Your professor gets a reminder on day 3. With no answer, the request closes on day 7.",
      },
      {
        q: "Can I read the letter?",
        a: "Only if your professor turns on a preview. Letters are confidential by default.",
      },
      {
        q: "Can I send one letter to several schools?",
        a: "Yes. Each school is a separate delivery with its own link and its own $5 fare.",
      },
    ],
  },
  {
    id: "professors",
    title: "Professors",
    lead: "You answer from an email. You never pay.",
    items: [
      {
        q: "Do I need an account?",
        a: "No. The link in the email is the way in. There is no password to set.",
      },
      {
        q: "Does it cost me anything?",
        a: "No. Professors never pay.",
      },
      {
        q: "Can I stop and come back?",
        a: "Yes. The draft saves as you write, so you can close the page and return to the same link.",
      },
      {
        q: "What happens when I finalize?",
        a: "The letter is sealed as a signed PDF. The signature shows if the file changes afterward.",
      },
      {
        q: "Do I approve each school?",
        a: "Yes. When the student sends your letter to a school, you get an email to approve that delivery.",
      },
      {
        q: "Can I decline?",
        a: "Yes. Decline from the same page. If you do nothing, the request closes on day 7.",
      },
    ],
  },
  {
    id: "schools",
    title: "Schools",
    lead: "You open one letter from one link.",
    items: [
      {
        q: "How do I open a letter?",
        a: "Use the secure link in the email. You confirm the email address it was sent to, and then the letter opens. You can view it or download it.",
      },
      {
        q: "Does it cost anything?",
        a: "No. The student pays the delivery fare.",
      },
      {
        q: "How long does the link work?",
        a: "The link expires 48 hours after the professor approves the delivery. Within that time, you can reopen it after confirming the same email address.",
      },
      {
        q: "How do I know the letter is genuine?",
        a: "The letter page shows the signature details. If the PDF changes after sealing, the signature no longer matches.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <section className='px-5 pb-10 pt-8 md:px-8 lg:pt-16'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Short answers, <span className='text-gold'>by who you are.</span>
          </h1>
          <nav aria-label='FAQ groups' className='mt-8 flex flex-wrap gap-3'>
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className='inline-flex h-11 items-center px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-flap-ink ring-1 ring-inset ring-flap-ink/40 hover:bg-flap'
              >
                {g.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {groups.map((g) => (
        <section
          key={g.id}
          id={g.id}
          aria-labelledby={`${g.id}-heading`}
          className='scroll-mt-24 px-5 py-10 md:px-8 md:py-14'
        >
          <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-12'>
            <div className='lg:col-span-4'>
              <h2
                id={`${g.id}-heading`}
                className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-5xl'
              >
                {g.title}
              </h2>
              <p className='mt-3 max-w-xs text-base text-flap-ink/85'>{g.lead}</p>
            </div>
            <div className='sheet px-5 md:px-8 lg:col-span-8'>
              <div className='divide-y divide-rule'>
                {g.items.map((item) => (
                  <details key={item.q} className='group'>
                    <summary className='flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden'>
                      <span className='text-base font-semibold text-ink md:text-lg'>{item.q}</span>
                      <span
                        aria-hidden='true'
                        className='font-display text-2xl font-bold leading-none text-forest transition-transform group-open:rotate-45'
                      >
                        +
                      </span>
                    </summary>
                    <div className='pb-4 text-base leading-relaxed text-ink-2'>{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className='px-5 pb-20 pt-6 md:px-8 md:pb-28'>
        <div className='mx-auto flex max-w-6xl flex-col items-start gap-6 border-t border-flap pt-10 md:flex-row md:items-center md:justify-between'>
          <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em]'>
            Not here? Ask us.
          </p>
          <LinkButton href='/contact' variant='gold' size='lg'>
            Contact us
          </LinkButton>
        </div>
      </section>
    </>
  );
}
