"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = { id: string; email: string; role: "STUDENT" | "FACULTY" | "ADMIN"} | null ;

async function fetchMe(): Promise<User> {
  const res = await fetch("/api/auth/me", { cache: "no-store"});
  const data = await res.json();
  return data.user ?? null;
}

export default function AuthPage() {
  const [tab, setTab] = useState<"register" | "login">("register");
  const [me, setMe] = useState<User>(null);
  const [status, setStatus] = useState<string>("");

  // Register from the state
  const [role, setRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [registerEmail, setRegisterEmail] = useState("test@university.edu");
  const [registerPassword, setRegisterPassword] = useState("12345678");
  const [fullName, setFullName] = useState("Test User");

  // Student State fields
  const [university, setUniversity] = useState("University");
  const [program, setProgram] = useState("Computer Science");
  const [graduationDate, setGraduationDate] = useState("");

  // Faculity State fields
  const [institution, setInstitution] = useState("University");
  const [department, setDepartment] = useState("Computer Science");
  const [title, setTitle] = useState("Professor");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("test@university.edu");
  const [loginPassword, setLoginPassword] = useState("Password");
  
  useEffect(() => {
    (async () => setMe(await fetchMe()))();
  }, []);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Registering...");

    const payload: any = { /* eslint-disable-line @typescript-eslint/no-explicit-any */
      email: registerEmail,
      password: registerPassword,
      role,
      fullName,
    };

    // Check which role we have, then add the proper state fields to the payload object
    if(role === "STUDENT") {
      payload.university = university;
      payload.program = program;
      if(graduationDate) payload.graduationDate = graduationDate;
    } else {
      payload.institution = institution;
      payload.department = department;
      payload.title = title;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if(!res.ok) {
      setStatus(`❌ ${data.error ?? "Register failed."}`);
      return;
    }

    setStatus("✅ Registered (and logged in).");
    setMe(await fetchMe());
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Logging in...");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });

    const data = await res.json();
    if(!res.ok) {
      setStatus(`❌ ${data.error ?? "Login failed"}`);
      return;
    }

    setStatus("✅ Logged in.");
    setMe(await fetchMe());
  }

  async function onLogout() {
    setStatus("Logging out...");

    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });

    const data = await res.json();
    if(!res.ok) {
      setStatus(`❌ ${data.error ?? "Logout failed"}`);
      return;
    }

    setStatus("✅ Logged out.");
    setMe(await fetchMe());
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          ReadMyStudent - Authentication
        </h1>
        <p className="text-sm text-gray-400">
          Bare Bones UI for register/login/logout. Uses API routes and cookies.
        </p>
        <p className="text-sm text-gray-400 hover:underline cursor-pointer">
          <Link href={"/"}>Click here to go back to home page</Link>
        </p>
      </header>

      {/* Logout */}
      <section className="rounded-xl border p-4 space-y-2">
        <div className="text-sm">
          <div className="font-medium">Current session (api/auth/me)</div>
          <pre className="mt-2 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            {JSON.stringify(me, null, 2)}
          </pre>
        </div>
        <button onClick={onLogout} className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 hover:text-black">
          Logout
        </button>
      </section>

      {/* Register + Login */}
      <section className="rounded-xl border p-4 space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setTab("register")} className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 hover:text-black">
            Register
          </button>
          <button onClick={() => setTab("login")} className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 hover:text-black">
            Login
          </button>
        </div>

        {/* Form */}
        {tab === "register" ? (
        <form onSubmit={onRegister} className="space-y-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Role</label>
            <select className="rounded-lg border p-2" value={role} onChange={(e) => setRole(e.target.value as any)}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              <option className="text-black" value="STUDENT">STUDENT</option>
              <option className="text-black" value="FACULTY">FACULTY</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Full name</label>
            <input className="rounded-lg border p-2" value={fullName} onChange={(e) => setFullName(e.target.value)}/>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <input className="rounded-lg border p-2" value={registerEmail} 
              onChange={(e) => setRegisterEmail(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Password</label>
            <input type="password" className="rounded-lg border p-2" value={registerPassword} 
              onChange={(e) => setRegisterPassword(e.target.value)} />
          </div>

          {role === "STUDENT" ? (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium">University</label>
                <input className="rounded-lg border p-2" value={university} 
                  onChange={(e) => setUniversity(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Program</label>
                <input className="rounded-lg border p-2" value={program} 
                  onChange={(e) => setProgram(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Graduation Date (optional)</label>
                <input className="rounded-lg border p-2" value={graduationDate} placeholder="2027-05-15"
                  onChange={(e) => setGraduationDate(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Institution</label>
                <input className="rounded-lg border p-2" value={institution} 
                  onChange={(e) => setInstitution(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Department</label>
                <input className="rounded-lg border p-2" value={department} 
                  onChange={(e) => setDepartment(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Title</label>
                <input className="rounded-lg border p-2" value={title} 
                  onChange={(e) => setTitle(e.target.value)} />
              </div>
            </>
          )}

          <button className="cursor-pointer border hover:bg-white hover:text-black w-full rounded-lg bg-black py-2 text-sm font-medium text-white">
            Create Account
          </button>

        </form> ) : (
          <form className="space-y-3" onSubmit={onLogin}>
            
            <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <input className="rounded-lg border p-2" value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <input type="password" className="rounded-lg border p-2" value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} />
            </div>

            <button className="border py-3 cursor-pointer hover:bg-white hover:text-black w-full rounded-lg bg-black text-sm font-medium text-white">
              Login
            </button>
          </form>
        )}

        <div className="text-sm">
          <div className="font-medium">Status</div>
          <pre className="mt-2 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-black">{status}</pre>
        </div>
      </section>
    </main>
  );
}