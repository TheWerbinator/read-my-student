"use client";

import Link from "next/link";
import { useState } from "react";
import { CountryCombobox } from "@/components/auth/CountryCombobox";
import { UniversityCombobox } from "@/components/auth/UniversityCombobox";

type Role = "STUDENT" | "FACULTY";

export default function RegisterPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // match your backend schema fields
  const [role, setRole] = useState<Role>("STUDENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [university, setUniversity] = useState<null | { id: string; name: string; countryCode: string }>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [agree, setAgree] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!countryCode) return setStatus("❌ Please select your country / region.");
    if (!agree) return setStatus("❌ You must agree to the Terms of Service.");
    if (password !== password2) return setStatus("❌ Passwords do not match.");
    if (!university) return setStatus("❌ Please select your university.");

    setLoading(true);
    try {
      const body =
        role === "STUDENT"
          ? { email, password, role, firstName, lastName, university: university?.name ?? "", countryCode }
          : { email, password, role, firstName, lastName, institution: university?.name ?? "", countryCode };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ the res is not okay: ${data.error ?? "Registration failed"}`);
        return;
      }

      setStatus("✅ Account created. You can now log in.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatus(`❌ there was an erorr with the try block ${err?.message ?? "Network error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-42">
        <div className="mx-auto max-w-3xl">
          {/* Heading */}
          <h1 className="text-3xl font-serif font-semibold text-[#0b4726]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#0b4726]/70">
            Set up your ReadMyStudent account in just a few steps.
          </p>

          {/* Card */}
          <div className="mt-8 rounded-3xl border border-black/10 bg-white shadow-xl shadow-black/5">
            <form onSubmit={onSubmit} className="space-y-8 p-8">
              {/* Role selector */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0b4726]">
                  Account type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["STUDENT", "FACULTY"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                        role === r
                          ? "border-[#0b4726] bg-[#0b4726]/10 text-[#0b4726]"
                          : "border-black/10 bg-white text-black/60 hover:bg-black/5",
                      ].join(" ")}
                    >
                      {r === "STUDENT" ? "Student" : "Faculty"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <Field label="First name" required value={firstName} onChange={setFirstName} placeholder="Jane Doe" />
              <Field label="Last name" required value={lastName} onChange={setLastName} placeholder="Jane Doe" />
              <Field label="Email" required value={email} onChange={setEmail} placeholder="you@university.edu" type="email" />
              <CountryCombobox
                required
                value={countryCode}
                onChange={(code: string) => {
                  setCountryCode(code);
                  setUniversity(null);
                }}
              />
              <UniversityCombobox
                label={role === "STUDENT" ? "University" : "Institution"}
                required
                countryCode={countryCode}
                value={university}
                onChange={(u) => setUniversity(u)}
                disabled={!countryCode}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Password" required value={password} onChange={setPassword} type="password" placeholder="••••••••" />
                <Field label="Confirm password" required value={password2} onChange={setPassword2} type="password" placeholder="••••••••" />
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 text-sm text-black/70">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-black/20 text-[#0b4726]"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link className="font-semibold text-[#0b4726] hover:underline" href="/terms">
                    ReadMyStudent Terms of Service
                  </Link>
                </span>
              </label>

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
                {loading ? "Creating account…" : "Create account"}
              </button>

              <p className="text-center text-sm text-black/60">
                Already have an account?{" "}
                <Link className="font-semibold text-[#0b4726] hover:underline" href="/auth/login">
                  Log in
                </Link>
              </p>
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
  disabled?: boolean;
}) {
  const { label, required, value, onChange, placeholder, type, disabled } = props;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
      <label className="text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      <div className="md:col-span-2">
        <input
          type={type ?? "text"}
          disabled={disabled}
          className={[
            "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700",
            disabled ? "cursor-not-allowed bg-gray-50 opacity-60" : "",
          ].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

