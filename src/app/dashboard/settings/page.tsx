import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChangeEmailForm } from "@/components/dashboard/ChangeEmailForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className='min-h-screen bg-[#fbfbf8] p-6 md:p-10'>
      <div className='mx-auto max-w-2xl space-y-8'>
        <div>
          <h1 className='font-serif text-3xl font-semibold text-green-900'>
            Account Settings
          </h1>
          <p className='mt-1 text-green-900/70'>
            Manage your account details and preferences.
          </p>
        </div>

        <ChangeEmailForm currentEmail={user.email} />
      </div>
    </div>
  );
}
