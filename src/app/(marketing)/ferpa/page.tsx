import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FERPA Compliance",
  description:
    "How ReadMyStudent ensures FERPA compliance, data security, and student privacy through digital waivers and bank-grade encryption.",
};

const standards = [
  {
    title: "Digital Waivers",
    body: "Immutable records of student choices regarding their right to inspect letters.",
  },
  {
    title: "Strict Access Control",
    body: "If a waiver is signed, the student platform is technically blocked from ever displaying the letter content.",
  },
  {
    title: "End-to-End Encryption",
    body: "Data is encrypted at rest (AES-256) and in transit (TLS 1.2+).",
  },
  {
    title: "Data Sovereignty",
    body: "All data is stored in secure, compliant US-based data centers.",
  },
];

const questions = [
  {
    q: "What is FERPA?",
    a: "The Family Educational Rights and Privacy Act (FERPA) is a federal law that protects the privacy of student education records. It gives parents and eligible students certain rights over their records.",
  },
  {
    q: "Do students see the letters?",
    a: "If a student waives their right to view the letter (which implies confidentiality), our system strictly prevents them from accessing the document. If they do not waive their right, faculty are notified before they accept the request.",
  },
  {
    q: "Who owns the data?",
    a: "The users own their data. We act as a data processor. We do not sell data to third parties, advertisers, or recruiters.",
  },
  {
    q: "Is this compliant for University use?",
    a: "Yes. ReadMyStudent is designed to meet the data handling and privacy requirements of higher education institutions.",
  },
];

export default function FerpaPage() {
  return (
    <div className='px-5 py-12 md:px-8 md:py-20'>
      <div className='mx-auto max-w-4xl'>
        <header>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            FERPA <span className='text-gold'>compliance</span>
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90'>
            ReadMyStudent is built to align with the Family Educational Rights
            and Privacy Act (FERPA). We provide the digital infrastructure to
            manage rights waivers, consent, and data security, protecting both
            students and institutions.
          </p>

          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <LinkButton href='/signup?role=faculty' variant='gold' size='lg'>
              Join as Faculty
            </LinkButton>
            <LinkButton href='/contact' variant='board' size='lg'>
              Contact Security Team
            </LinkButton>
          </div>

          <p className='caption mt-6 text-flap-dim'>
            AES-256 Encryption • Digital Waivers • Audit Logs
          </p>
        </header>

        <article className='sheet mt-10 px-5 py-8 sm:px-10 md:mt-14 md:px-14 md:py-12'>
          <div className='prose-paper break-words text-base text-ink'>
            <h2 id='right-to-inspect' className='scroll-mt-6 mt-0!'>
              The &quot;Right to Inspect&quot; vs. Confidentiality
            </h2>
            <p>
              Under FERPA, students have the right to inspect their education
              records, including letters of recommendation. However, to ensure
              candor, faculty often require students to{" "}
              <strong>waive this right</strong> before writing a letter.
            </p>
            <p>
              Managing these waivers via email is risky and ambiguous.
              &quot;Did the student actually say they waived it?&quot; &quot;Where
              is that email saved?&quot; &quot;What if the student changes their
              mind later?&quot;
            </p>
            <p>
              ReadMyStudent solves this by making the waiver declaration a{" "}
              <strong>mandatory, immutable step</strong> in the request
              process.
            </p>

            <h3>Clear, Digital Consent</h3>
            <p>
              Before a request is sent, the student must explicitly select:{" "}
              <em>&quot;I waive my right to access this letter&quot;</em> or{" "}
              <em>&quot;I retain my right.&quot;</em> This selection is stamped
              onto the request card for the faculty member to see immediately.
            </p>

            <h2 id='data-security-standards' className='scroll-mt-6'>
              Data security standards
            </h2>
            <dl className='mt-3 divide-y divide-rule border-y border-rule'>
              {standards.map((s) => (
                <div key={s.title} className='py-4'>
                  <dt className='font-bold'>{s.title}</dt>
                  <dd className='mt-1 text-ink-2'>{s.body}</dd>
                </div>
              ))}
            </dl>

            <h2 id='common-questions' className='scroll-mt-6'>
              Common Questions
            </h2>
            {questions.map((item) => (
              <div key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
            <p className='mt-8'>
              <Link href='/privacy'>Read our full Privacy Policy →</Link>
            </p>
          </div>
        </article>

        <section
          aria-labelledby='ferpa-cta'
          className='mt-14 flex flex-col gap-6 md:flex-row md:items-center md:justify-between'
        >
          <h2
            id='ferpa-cta'
            className='font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-4xl'
          >
            Ready to upgrade your workflow?
          </h2>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <LinkButton href='/signup?role=student' variant='gold' size='lg'>
              Start as a Student
            </LinkButton>
            <LinkButton href='/signup?role=faculty' variant='board' size='lg'>
              Join as Faculty
            </LinkButton>
          </div>
        </section>
      </div>
    </div>
  );
}
