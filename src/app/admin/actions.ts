"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { z } from "zod";
import { DependentInviteEmail } from "@/components/letter-request-email-templates";
import { adminDb, requireAdmin, saveCatalogItem } from "@/lib/admin";
import { parseCatalogForm, type CatalogForm } from "@/lib/catalog";
import { stripe } from "@/lib/stripe";
import { stripePriceSync } from "@/lib/stripe-catalog";

const inviteSchema = z.object({
  dependentName: z.string().trim().min(2, "Enter the dependent's name."),
  dependentEmail: z.email("Enter the dependent's email."),
  facultyEmail: z.email("Enter the professor's account email."),
});

export type InviteResult = { ok: true } | { ok: false; error: string };

/**
 * Invites a faculty dependent (owner, 2026-11-11). The professor must already
 * have an account. The dependent claims the invite from the dashboard
 * (claimDependentInvite), so this works for new and existing accounts.
 */
export async function inviteDependentAction(form: z.input<typeof inviteSchema>): Promise<InviteResult> {
  const adminUserId = await requireAdmin();
  if (!adminUserId) return { ok: false, error: "You do not have access to invites." };
  const parsed = inviteSchema.safeParse(form);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { dependentName, dependentEmail, facultyEmail } = parsed.data;
  const db = adminDb();

  // Faculty rows have no email for account holders, so find the auth user first.
  // shortcut: one page of 1000 users, the same lookup as sendLetterRequest; page through when users pass 1000.
  const { data: users, error: usersError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw usersError;
  const professor = users.users.find((u) => u.email?.toLowerCase() === facultyEmail.toLowerCase());
  const { data: faculty } = professor
    ? await db.from("faculty").select("id").eq("user_id", professor.id).maybeSingle()
    : { data: null };
  if (!professor || !faculty) {
    return { ok: false, error: `No professor account uses ${facultyEmail}. Ask the professor to sign up first.` };
  }

  const email = dependentEmail.toLowerCase();
  const { data: invite, error: insertError } = await db
    .from("dependent_invites")
    .insert({ email, dependent_name: dependentName, faculty_id: faculty.id, invited_by: adminUserId })
    .select("id")
    .single();
  if (insertError?.code === "23505") return { ok: false, error: `${email} already has an invite.` };
  if (insertError) throw insertError;

  const facultyName =
    [professor.user_metadata?.firstName, professor.user_metadata?.lastName].filter(Boolean).join(" ") || "A professor";
  // Made here, not at import, so the catalog action and its tests need no Resend key.
  const { error: emailError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "ReadMyStudent <notification@readmystudent.com>",
    to: email,
    subject: "Your letter requests are free for 3 years",
    html: DependentInviteEmail({
      dependentName,
      facultyName,
      signupUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?role=student&email=${encodeURIComponent(email)}`,
    }),
  });
  if (emailError) {
    // The dependent never heard about it, so the invite must not exist.
    await db.from("dependent_invites").delete().eq("id", invite.id);
    return { ok: false, error: `The email could not be sent: ${emailError.message}` };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string> };

export async function saveCatalogItemAction(id: string | null, form: CatalogForm): Promise<SaveResult> {
  const adminUserId = await requireAdmin();
  if (!adminUserId) return { ok: false, errors: { form: "You do not have access to the catalog." } };

  const parsed = parseCatalogForm(form);
  if (!parsed.ok) return parsed;

  try {
    await saveCatalogItem(adminDb(), adminUserId, id, parsed.row, stripePriceSync(stripe));
  } catch (err) {
    console.error("[admin] Catalog save failed:", err);
    return { ok: false, errors: { form: "The catalog could not be saved. Try again." } };
  }
  revalidatePath("/admin");
  return { ok: true };
}
