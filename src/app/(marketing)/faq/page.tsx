import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  ShieldCheck,
  Lock,
  Link2,
  GraduationCap,
  Users,
  CreditCard,
} from "lucide-react";

export const metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about ReadMyStudent: single-use recommendation links, faculty workflow, security, pricing, and viewer access.",
};

type FAQItem = {
  q: string;
  a: React.ReactNode;
};

export default function FAQPage() {
  const faqs: { section: string; icon: React.ReactNode; items: FAQItem[] }[] = [
    {
      section: "Getting started",
      icon: <GraduationCap className='h-5 w-5' />,
      items: [
        {
          q: "What is ReadMyStudent?",
          a: (
            <>
              ReadMyStudent is a secure platform for requesting, managing, and
              sharing recommendation letters. It’s designed to reduce student
              anxiety and faculty workload while preserving academic integrity.
            </>
          ),
        },
        {
          q: "Who is it for?",
          a: (
            <>
              Students requesting recommendations, faculty writing them, and
              verified viewers (universities and employers) who need a secure,
              consent-based way to view a student-approved letter.
            </>
          ),
        },
        {
          q: "Is it free to sign up?",
          a: (
            <>
              Yes — signup is free. Students get their first{" "}
              <span className='font-semibold text-green-900'>
                3 single-use recommendation links
              </span>{" "}
              free. Faculty access is free.
            </>
          ),
        },
      ],
    },
    {
      section: "Single-use links (core rule)",
      icon: <Link2 className='h-5 w-5' />,
      items: [
        {
          q: "What is a single-use recommendation link?",
          a: (
            <>
              It&apos;s a uniquely generated submission link tied to a specific
              request. Once it&apos;s used to submit, it automatically expires
              and can&apos;t be reused.
            </>
          ),
        },
        {
          q: "Why single-use links?",
          a: (
            <>
              Single-use links close the biggest loopholes in the traditional
              process: link forwarding, replay submissions, and unclear access.
              It keeps sharing clean, controlled, and auditable.
            </>
          ),
        },
        {
          q: "Can I reuse the same link for multiple programs?",
          a: (
            <>
              No — each submission requires a fresh link. This preserves
              integrity and prevents unauthorized reuse. If you’re applying
              broadly, that&apos;s what the Sprint plan is built for.
            </>
          ),
        },
      ],
    },
    {
      section: "Faculty workflow",
      icon: <Users className='h-5 w-5' />,
      items: [
        {
          q: "Is it free for faculty?",
          a: (
            <>
              Yes. Faculty access is free. The product is designed to reduce
              repeated effort and portal chaos, not add new friction.
            </>
          ),
        },
        {
          q: "Do faculty have to learn a new portal for every school?",
          a: (
            <>
              No. Students generate a unique link per submission. Faculty follow
              the link and submit once. The link expires after submission to
              prevent reuse.
            </>
          ),
        },
        {
          q: "Does this make faculty work harder?",
          a: (
            <>
              It should reduce workload for most cases. The tradeoff is that
              each submission uses a fresh link, but it removes reminders,
              repeated emailing, and scattered portals across cycles.
            </>
          ),
        },
      ],
    },
    {
      section: "Security, privacy, and trust",
      icon: <ShieldCheck className='h-5 w-5' />,
      items: [
        {
          q: "Who controls access to the recommendation letter?",
          a: (
            <>
              Students control who receives access by choosing where to generate
              links. Faculty control the letter content and submission. Access
              is consent-based.
            </>
          ),
        },
        {
          q: "Are letters encrypted?",
          a: (
            <>
              The system is designed for strong access controls and secure
              storage. If you have a specific compliance or institutional
              requirement, contact us and we&apos;ll route it appropriately.
            </>
          ),
        },
        {
          q: "Do you email recommendation letters?",
          a: (
            <>
              No — we don&apos;t ask for letter content over email. Letters are
              handled inside the platform with secure access controls.
            </>
          ),
        },
      ],
    },
    {
      section: "Pricing",
      icon: <CreditCard className='h-5 w-5' />,
      items: [
        {
          q: "What does it cost?",
          a: (
            <>
              Students start free with 3 links. After that, it&apos;s{" "}
              <span className='font-semibold text-green-900'>
                $5 per single-use link
              </span>
              . For heavy application cycles, the Sprint plan is{" "}
              <span className='font-semibold text-green-900'>
                $399 for up to 100 links
              </span>{" "}
              in 30 days.
            </>
          ),
        },
        {
          q: "What happens when the Sprint plan ends?",
          a: (
            <>
              The Sprint ends when either 100 links are generated or 30 days
              pass (whichever comes first). You can start another Sprint or
              switch back to pay-as-you-go.
            </>
          ),
        },
        {
          q: "Why is Sprint priced at $399?",
          a: (
            <>
              It&apos;s intentionally premium and abuse-resistant: it undercuts
              pay-as-you-go at 100 links ($500), while still signaling
              admissions-grade infrastructure.
            </>
          ),
        },
      ],
    },
    {
      section: "Viewer access (universities & employers)",
      icon: <Lock className='h-5 w-5' />,
      items: [
        {
          q: "Can universities view letters for free?",
          a: (
            <>
              Yes, with verified domains. Viewing is read-only and only occurs
              with explicit student consent.
            </>
          ),
        },
        {
          q: "Can employers view letters for free?",
          a: (
            <>
              Yes, with verified company emails. Access is always tied to
              student-approved links and auditability.
            </>
          ),
        },
      ],
    },
  ];

  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 py-16 md:pt-40 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-green-900 border border-green-900/10'>
            FAQ
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-green-900 leading-tight'>
            Clear answers —{" "}
            <span className='italic text-amber-500'>no ambiguity</span>.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            If you can’t find what you’re looking for, reach out via the{" "}
            <Link className='hover:underline' href={"/contact"}>
              contact form.
            </Link>
          </p>

          <div className='mt-8 flex flex-col sm:flex-row gap-6'>
            <LinkButton
              href='/contact'
              variant='green'
              size='lg'
              className='rounded-xl justify-center'
            >
              Contact us
            </LinkButton>

            <LinkButton
              href='/how-it-works'
              variant='secondary'
              size='lg'
              className='rounded-xl justify-center'
            >
              Learn how it works
            </LinkButton>
          </div>
        </div>
      </section>

      {/* FAQ SECTIONS */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          {/* Left: small nav feel */}
          <aside className='lg:col-span-4'>
            <div className='rounded-3xl border border-green-900/10 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sticky top-64'>
              <div className='text-xs font-semibold tracking-wide text-black/45'>
                QUICK LINKS
              </div>
              <div className='mt-3 space-y-2'>
                {faqs.map((s) => (
                  <a
                    key={s.section}
                    href={`#${slug(s.section)}`}
                    className='block rounded-xl px-3 py-2 text-sm font-semibold text-green-900 hover:bg-[#eaf3ee] border border-transparent hover:border-green-900/10 transition'
                  >
                    {s.section}
                  </a>
                ))}
              </div>

              <div className='mt-6 rounded-2xl border border-amber-200 bg-[#fff7e6] p-4'>
                <div className='text-xs font-bold uppercase tracking-wide text-amber-700'>
                  Tip
                </div>
                <div className='mt-1 text-sm font-semibold text-[#0a2e1c]'>
                  Start with “Single-use links”
                </div>
                <div className='mt-1 text-sm text-[#5f7f6f]'>
                  That core rule explains most of the system.
                </div>
              </div>
            </div>
          </aside>

          {/* Right: content */}
          <div className='lg:col-span-8 space-y-8'>
            {faqs.map((s) => (
              <div
                key={s.section}
                id={slug(s.section)}
                className='rounded-3xl border border-green-900/10 bg-white px-6 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'
              >
                <div className='flex items-center gap-3'>
                  <div className='h-11 w-11 rounded-2xl bg-green-900/10 text-green-900 grid place-items-center border border-green-900/10'>
                    {s.icon}
                  </div>
                  <h2 className='font-serif text-2xl font-semibold text-[#0a2e1c]'>
                    {s.section}
                  </h2>
                </div>

                <div className='mt-5 divide-y divide-black/5'>
                  {s.items.map((item) => (
                    <details key={String(item.q)} className='group py-4'>
                      <summary className='cursor-pointer list-none flex items-start justify-between gap-4'>
                        <span className='text-sm md:text-base font-semibold text-green-900'>
                          {item.q}
                        </span>
                        <span className='mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf3ee] text-green-900 border border-green-900/10 transition group-open:rotate-45'>
                          +
                        </span>
                      </summary>

                      <div className='mt-3 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom CTA */}
            <div className='rounded-3xl border border-amber-200 bg-[#fff7e6] px-7 py-8'>
              <div className='text-xs font-bold uppercase tracking-wide text-amber-700'>
                Still unsure?
              </div>
              <div className='mt-2 font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
                Send us a message — we’ll point you to the right answer.
              </div>
              <p className='mt-2 text-sm text-[#5f7f6f]'>
                No sales calls. Just clear help.
              </p>

              <div className='mt-6'>
                <LinkButton
                  href='/contact'
                  variant='gold'
                  size='lg'
                  className='rounded-xl justify-center'
                >
                  Go to Contact
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
