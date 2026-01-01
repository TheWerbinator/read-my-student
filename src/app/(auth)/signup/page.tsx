"use client";

import Link from "next/link";
import { useState } from "react";

type Role = "STUDENT" | "FACULTY";

export default function RegisterPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // match your backend schema fields
  const [role, setRole] = useState<Role>("STUDENT");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState(""); // maps to university/institution depending on role
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [agree, setAgree] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!agree) return setStatus("❌ You must agree to the Terms of Service.");
    if (password !== password2) return setStatus("❌ Passwords do not match.");

    setLoading(true);
    try {
      const body =
        role === "STUDENT"
          ? { email, password, role, fullName, university: affiliation, program: "", graduationDate: "" }
          : { email, password, role, fullName, institution: affiliation, title: "", department: "" };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ ${data.error ?? "Registration failed"}`);
        return;
      }

      setStatus("✅ Account created. You can now log in.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? "Network error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 py-3">
            {/* Logo placeholder */}
            <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-400 font-bold text-white">
              R
            </div>
            <div className="text-lg font-semibold text-gray-800">Account Creation Pages</div>

            <div className="ml-auto text-sm">
              <Link className="text-emerald-700 hover:underline" href="/user-guide">
                User guide
              </Link>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-sky-800">
          <div className="mx-auto max-w-6xl px-4">
            <nav className="flex gap-1">
              <Link
                href="/"
                className="rounded-t px-3 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Home
              </Link>
              <Link
                href="/auth/login"
                className="rounded-t px-3 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Log in
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-gray-900">Create Account</h1>

        {/* Info block */}
        <section className="mt-3 max-w-3xl text-sm text-gray-700">
          <p>
            To use ReadMyStudent, you must agree to our{" "}
            <Link className="text-blue-700 hover:underline" href="/terms">
              Terms of Service
            </Link>
            .
          </p>
          <p className="mt-1">
            You may also be interested about our{" "}
            <Link className="text-blue-700 hover:underline" href="/privacy">
              policy for using personal information
            </Link>
            .
          </p>
        </section>

        {/* Instructions */}
        <section className="mt-8 max-w-3xl text-sm text-gray-700">
          <p>To create an account, fill out the form below.</p>
          <p className="mt-2">
            We will email you a verification link to activate your account (email verification coming soon).
          </p>
        </section>

        {/* Captcha placeholder */}
        <section className="mt-8">
          <div className="w-full max-w-sm rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded border border-gray-300" />
              <div className="text-sm text-gray-700">I am human</div>
              <div className="ml-auto text-xs text-gray-500">hCaptcha</div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              (Placeholder for now — I need to wire this later.)
            </p>
          </div>
        </section>

        {/* Form card */}
        <section className="mt-8">
          <div className="w-full max-w-4xl rounded border border-gray-200 bg-gray-100/60 p-8 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Role */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
                <label className="text-sm font-medium text-gray-800">
                  Account type<span className="text-red-600"> *</span>
                </label>
                <div className="md:col-span-2">
                  <select
                    className="w-full text-gray-400 rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                  </select>
                </div>
              </div>

              {/* Full name */}
              <Field
                label="Full name"
                required
                value={fullName}
                onChange={setFullName}
                placeholder="Jane Doe"
              />

              {/* Email */}
              <Field
                label="Email"
                required
                value={email}
                onChange={setEmail}
                placeholder="you@university.edu"
                type="email"
              />

              {/* Affiliation */}
              <Field
                label={role === "STUDENT" ? "University" : "Institution"}
                required
                value={affiliation}
                onChange={setAffiliation}
                placeholder={role === "STUDENT" ? "Stanford University" : "University of X"}
              />

              {/* Country */}
              <Field
                label="Country/region"
                required
                value={country}
                onChange={setCountry}
                placeholder="United States"
              />

              {/* Password */}
              <Field
                label="Password"
                required
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="••••••••"
              />

              <Field
                label="Retype password"
                required
                value={password2}
                onChange={setPassword2}
                type="password"
                placeholder="••••••••"
              />

              <hr className="border-gray-300" />

              {/* Terms */}
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link className="text-blue-700 hover:underline" href="/terms">
                    ReadMyStudent Terms of Service
                  </Link>
                </span>
              </label>

              {/* Status + submit */}
              {status ? (
                <div className="rounded border border-gray-200 bg-white px-3 py-2 text-sm">
                  {status}
                </div>
              ) : null}

              <div className="flex justify-center">
                <button
                  disabled={loading}
                  className="rounded bg-red-700 px-10 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                  type="submit"
                >
                  {loading ? "Creating..." : "Continue"}
                </button>
              </div>

              <div className="text-center text-sm text-gray-700">
                Already have an account?{" "}
                <Link className="text-blue-700 hover:underline" href="/auth/login">
                  Log in
                </Link>
              </div>
            </form>
          </div>
        </section>
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
}) {
  const { label, required, value, onChange, placeholder, type } = props;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
      <label className="text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <div className="md:col-span-2">
        <input
          type={type ?? "text"}
          className="w-full rounded border text-gray-700 border-gray-300 bg-white px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
