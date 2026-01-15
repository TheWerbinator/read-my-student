import { Star } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  title: string;
  org: string;
  initials: string;
  stars?: number; // 1-5
};

type Stat = {
  value: string;
  label: string;
};

export default function SocialProof() {
  const testimonials: Testimonial[] = [
    {
      quote:
        "ReadMyStudent transformed how I handle recommendation requests. Everything is organized, secure, and my students love having control over their letters.",
      name: "Dr. Sarah Chen",
      title: "Professor of Computer Science",
      org: "Stanford University",
      initials: "SC",
      stars: 5,
    },
    {
      quote:
        "I applied to 12 graduate programs and used ReadMyStudent for all of them. The consent-based sharing gave me peace of mind knowing exactly who viewed my letters.",
      name: "Marcus Johnson",
      title: "PhD Student",
      org: "MIT",
      initials: "MJ",
      stars: 5,
    },
    {
      quote:
        "As an admissions officer, I appreciate the verification features. We can trust that letters are authentic and haven't been tampered with.",
      name: "Emily Rodriguez",
      title: "Director of Admissions",
      org: "Yale University",
      initials: "ER",
      stars: 5,
    },
  ];

  const stats: Stat[] = [
    { value: "50K+", label: "Students" },
    { value: "10K+", label: "Faculty Members" },
    { value: "500+", label: "Universities" },
    { value: "100K+", label: "Letters Shared" },
  ];

  return (
    <section className="bg-[#fbfbf8]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-[#0b4726]">
            Trusted Worldwide
          </span>
        </div>

        {/* heading */}
        <div className="mx-auto mt-6 max-w-3xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726]">
            Loved by Students &amp;{" "}
            <span className="italic text-amber-500">Faculty</span>
          </h2>
          <p className="mt-4 text-sm md:text-base leading-relaxed text-[#0b4726]">
            Join thousands of academic professionals and students who trust ReadMyStudent for
            their recommendation letters.
          </p>
        </div>

        {/* testimonial cards */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>

        {/* stats */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-black/10 bg-white px-8 py-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="font-serif text-3xl md:text-4xl font-semibold text-amber-500">
                {s.value}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0b4726]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const stars = Math.max(1, Math.min(5, t.stars ?? 5));

  return (
    <div className="rounded-2xl border border-black/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      {/* big quote mark */}
      <div className="text-amber-500 font-serif text-6xl leading-none select-none">
        “
      </div>

      {/* stars */}
      <div className="mt-2 flex items-center gap-1 text-amber-500">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>

      {/* quote */}
      <p className="mt-4 text-sm leading-relaxed text-[#0b4726] italic">
        {`"${t.quote}"`}
      </p>

      {/* footer */}
      <div className="mt-8 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-[#0b4726] text-white font-bold grid place-items-center">
          {t.initials}
        </div>

        <div className="leading-tight">
          <div className="font-semibold text-[#0b4726]">{t.name}</div>
          <div className="text-xs font-semibold text-[#3f8b61]">{t.title}</div>
          <div className="text-xs italic text-amber-600">{t.org}</div>
        </div>
      </div>
    </div>
  );
}
