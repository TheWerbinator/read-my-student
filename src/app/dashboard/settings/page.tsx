import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChangeEmailForm } from "@/components/dashboard/ChangeEmailForm";
import { FacultyProfileSettingsForm } from "@/components/dashboard/FacultyProfileSettingsForm";
import { getFacultyProfile } from "@/app/actions/faculty";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isFaculty = user.user_metadata?.role === "FACULTY";
  const facultyProfile = isFaculty ? await getFacultyProfile() : null;

  return (
    <div className='p-6 md:p-10'>
      <div className='mx-auto max-w-2xl space-y-8'>
        <div>
          <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-flap-ink md:text-3xl'>
            Account Settings
          </h1>
          <p className='mt-2 text-flap-dim'>
            Manage your account details and preferences.
          </p>
        </div>

        <ChangeEmailForm currentEmail={user.email} />

        {isFaculty && (
          <FacultyProfileSettingsForm
            initialProfile={facultyProfile}
            authDetails={{
              email: user.email ?? "",
              firstName: (user.user_metadata?.firstName as string) ?? "",
              lastName: (user.user_metadata?.lastName as string) ?? "",
            }}
          />
        )}
      </div>
    </div>
  );
}
