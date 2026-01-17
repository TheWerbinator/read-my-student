import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { FileSignature, EyeOff, Server, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FERPA Compliance",
  description:
    "How ReadMyStudent ensures FERPA compliance, data security, and student privacy through digital waivers and bank-grade encryption.",
};

export default function FerpaPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-[#0b4726] border border-[#0b4726]/10'>
            Compliance & Privacy
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight'>
            Privacy is the{" "}
            <span className='italic text-amber-500'>foundation</span> of
            academic trust.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            ReadMyStudent is built to align with the Family Educational Rights
            and Privacy Act (FERPA). We provide the digital infrastructure to
            manage rights waivers, consent, and data security—protecting both
            students and institutions.
          </p>

          <div className='mt-8 flex flex-col sm:flex-row gap-3'>
            <LinkButton
              href='/signup?role=faculty'
              variant='green'
              size='lg'
              className='rounded-xl justify-center'
            >
              Join as Faculty
            </LinkButton>
            <LinkButton
              href='/contact'
              variant='secondary'
              size='lg'
              className='rounded-xl justify-center bg-[#eaf3ee] border border-[#0b4726]/10 hover:bg-[#dff0e6]'
            >
              Contact Security Team
            </LinkButton>
          </div>

          <div className='mt-6 text-xs font-semibold text-[#0b4726]/60'>
            AES-256 Encryption • Digital Waivers • Audit Logs
          </div>
        </div>
      </section>

      {/* COMPLIANCE EXPLAINER */}
      <section className='mx-auto max-w-7xl px-6 py-10 md:py-14 lg:pl-24'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          {/* Left Column: The Waiver Logic */}
          <div className='lg:col-span-7'>
            <h2 className='font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
              The &quot;Right to Inspect&quot; vs. Confidentiality
            </h2>

            <div className='mt-4 space-y-4 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
              <p>
                Under FERPA, students have the right to inspect their education
                records, including letters of recommendation. However, to ensure
                candor, faculty often require students to{" "}
                <strong>waive this right</strong> before writing a letter.
              </p>
              <p>
                Managing these waivers via email is risky and ambiguous.
                &quot;Did the student actually say they waived it?&quot;
                &quot;Where is that email saved?&quot; &quot;What if the student
                changes their mind later?&quot;
              </p>
              <p>
                ReadMyStudent solves this by making the waiver declaration a{" "}
                <strong>mandatory, immutable step</strong> in the request
                process.
              </p>
            </div>

            <div className='mt-7 rounded-2xl border border-[#0b4726]/10 bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
              <div className='text-xs font-bold uppercase tracking-wide text-amber-600'>
                How it works
              </div>
              <div className='mt-2 text-sm md:text-base font-semibold text-[#0a2e1c]'>
                Clear, Digital Consent
              </div>
              <div className='mt-2 text-sm text-[#5f7f6f]'>
                Before a request is sent, the student must explicitly select:{" "}
                <em>&quot;I waive my right to access this letter&quot;</em> or{" "}
                <em>&quot;I retain my right.&quot;</em> This selection is
                stamped onto the request card for the faculty member to see
                immediately.
              </div>
            </div>
          </div>

          {/* Right Column: Security Features */}
          <div className='lg:col-span-5'>
            <div className='rounded-3xl border border-[#0b4726]/10 bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
              <div className='text-xs font-semibold tracking-wide text-black/45'>
                DATA SECURITY STANDARDS
              </div>

              <ul className='mt-4 space-y-4'>
                <ValueRow
                  icon={<FileSignature className='h-5 w-5' />}
                  title='Digital Waivers'
                  body='Immutable records of student choices regarding their right to inspect letters.'
                />
                <ValueRow
                  icon={<EyeOff className='h-5 w-5' />}
                  title='Strict Access Control'
                  body='If a waiver is signed, the student platform is technically blocked from ever displaying the letter content.'
                />
                <ValueRow
                  icon={<Lock className='h-5 w-5' />}
                  title='End-to-End Encryption'
                  body='Data is encrypted at rest (AES-256) and in transit (TLS 1.2+).'
                />
                <ValueRow
                  icon={<Server className='h-5 w-5' />}
                  title='Data Sovereignty'
                  body='All data is stored in secure, compliant US-based data centers.'
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className='mx-auto max-w-7xl px-6 py-10 md:py-14 lg:pl-24'>
        <div className='rounded-3xl border border-[#0b4726]/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
          <h2 className='font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
            Common Questions
          </h2>

          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
            <QA
              q='What is FERPA?'
              a='The Family Educational Rights and Privacy Act (FERPA) is a federal law that protects the privacy of student education records. It gives parents and eligible students certain rights over their records.'
            />
            <QA
              q='Do students see the letters?'
              a='If a student waives their right to view the letter (which implies confidentiality), our system strictly prevents them from accessing the document. If they do not waive their right, faculty are notified before they accept the request.'
            />
            <QA
              q='Who owns the data?'
              a='The users own their data. We act as a data processor. We do not sell data to third parties, advertisers, or recruiters.'
            />
            <QA
              q='Is this compliant for University use?'
              a='Yes. ReadMyStudent is designed to meet the data handling and privacy requirements of higher education institutions.'
            />
          </div>

          <div className='mt-8 flex flex-col sm:flex-row items-center gap-3'>
            <Link
              href='/privacy'
              className='text-sm font-semibold text-[#0b4726]/75 hover:text-[#0b4726] transition-colors'
            >
              Read our full Privacy Policy →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='rounded-3xl border border-amber-200 bg-[#fff7e6] px-7 py-8'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
            <div>
              <div className='text-xs font-bold uppercase tracking-wide text-amber-700'>
                Secure & Compliant
              </div>
              <div className='mt-2 font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
                Ready to upgrade your workflow?
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
              <LinkButton
                href='/signup?role=student'
                variant='gold'
                size='lg'
                className='rounded-xl justify-center'
              >
                Start as a Student
              </LinkButton>
              <LinkButton
                href='/signup?role=faculty'
                variant='green'
                size='lg'
                className='rounded-xl justify-center'
              >
                Join as Faculty
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI Helper Components ---------- */

function ValueRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className='flex items-start gap-3'>
      <div className='mt-0.5 h-11 w-11 shrink-0 rounded-2xl bg-[#0b4726]/10 text-[#0b4726] grid place-items-center border border-[#0b4726]/10'>
        {icon}
      </div>
      <div>
        <div className='text-sm font-semibold text-[#0a2e1c]'>{title}</div>
        <div className='mt-1 text-sm text-[#5f7f6f] leading-relaxed'>
          {body}
        </div>
      </div>
    </li>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className='rounded-2xl border border-black/5 bg-[#fbfbf8] px-5 py-4'>
      <div className='text-sm font-semibold text-[#0a2e1c]'>{q}</div>
      <div className='mt-2 text-sm text-[#5f7f6f] leading-relaxed'>{a}</div>
    </div>
  );
}
