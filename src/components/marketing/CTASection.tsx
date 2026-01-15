import { GraduationCap, Users } from "lucide-react";
import { LinkButton } from "../ui/LinkButton";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#0b4726]">
      {/* soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_55%)]" />
      <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[40px_40px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20 text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-white">
          Ready to Get Started?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-white/70">
          Join thousands of students and faculty who trust ReadMyStudent for secure,
          respectful recommendation letters.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <LinkButton
            href="/signup?role=student"
            variant="gold"
            size="lg"
            className="min-w-56 justify-center rounded-xl"
          >
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              I&apos;m a Student
            </span>
          </LinkButton>

          <LinkButton
            href="/signup?role=faculty"
            variant="secondary"
            size="lg"
            className="min-w-56 justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/20"
          >
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              I&apos;m a Faculty
            </span>
          </LinkButton>
        </div>

        <div className="mt-8 text-xs font-semibold text-white/55">
          No credit card required • Free 30-day trial for students • Always free for faculty
        </div>
      </div>
    </section>
  );
}
