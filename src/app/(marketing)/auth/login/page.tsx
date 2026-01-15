"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Logo from "../../../../../public/green_yellow_logo_sized.png";

export default function LoginPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!email || !password) {
      setStatus("❌ Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(`❌ ${data.error ?? "Invalid email or password"}`);
        return;
      }

      setStatus("✅ Logged in!");

      // Redirect wherever makes sense
      window.location.href = "/dashboard"; // or "/faculty", "/student", etc.
      // eslint-disable-next-line
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? "Network error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-transparent">
      <main className="mx-auto max-w-6xl px-4 py-48">
        <div className="mx-auto max-w-3xl">
          {/* Heading */}
          <h1 className="text-3xl font-serif font-semibold text-[#0b4726]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#0b4726]/70">
            Log in to continue your recommendation workflow.
          </p>

          {/* Card */}
          <div className="mt-8 rounded-3xl border border-black/10 bg-white shadow-xl shadow-black/5">
            <form onSubmit={onSubmit} className="space-y-8 p-8">
              {/* Optional brand row */}
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-black/10 bg-white p-2">
                  <Image
                    src={Logo}
                    alt="ReadMyStudent logo"
                    priority
                    className="h-8 w-auto"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0b4726]">
                    ReadMyStudent
                  </div>
                  <div className="text-xs text-black/50">
                    Secure recommendation letters
                  </div>
                </div>
              </div>

              {/* Fields */}
              <Field
                label="Email"
                required
                value={email}
                onChange={setEmail}
                placeholder="you@university.edu"
                type="email"
                autoComplete="email"
              />

              <div className="space-y-2">
                <Field
                  label="Password"
                  required
                  value={password}
                  onChange={setPassword}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-[#0b4726] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Status */}
              {status && (
                <div
                  className={[
                    "rounded-2xl px-4 py-3 text-sm",
                    status.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {status}
                </div>
              )}

              {/* Submit */}
              <button
                disabled={loading}
                type="submit"
                className="mt-2 w-full rounded-2xl bg-[#0b4726] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4726]/90 disabled:opacity-60"
              >
                {loading ? "Logging in…" : "Log in"}
              </button>

              <p className="text-center text-sm text-black/60">
                New here?{" "}
                <Link
                  className="font-semibold text-[#0b4726] hover:underline"
                  href="/auth/signup"
                >
                  Create an account
                </Link>
              </p>

              <div className="text-center text-xs text-black/45">
                By logging in, you agree to our{" "}
                <Link className="text-[#0b4726] hover:underline" href="/terms">
                  Terms
                </Link>{" "}
                and{" "}
                <Link className="text-[#0b4726] hover:underline" href="/privacy">
                  Privacy Policy
                </Link>
                .
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field(props: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  const { label, required, value, onChange, placeholder, type, autoComplete } =
    props;

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center md:gap-4">
      <label className="text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <div className="md:col-span-2">
        <input
          type={type ?? "text"}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-[#0b4726] focus:outline-none focus:ring-2 focus:ring-[#0b4726]/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
