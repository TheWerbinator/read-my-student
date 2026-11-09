"use server";

import { revalidatePath } from "next/cache";
import { adminDb, requireAdmin, saveCatalogItem } from "@/lib/admin";
import { parseCatalogForm, type CatalogForm } from "@/lib/catalog";

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string> };

export async function saveCatalogItemAction(id: string | null, form: CatalogForm): Promise<SaveResult> {
  const adminUserId = await requireAdmin();
  if (!adminUserId) return { ok: false, errors: { form: "You do not have access to the catalog." } };

  const parsed = parseCatalogForm(form);
  if (!parsed.ok) return parsed;

  try {
    await saveCatalogItem(adminDb(), adminUserId, id, parsed.row);
  } catch (err) {
    console.error("[admin] Catalog save failed:", err);
    return { ok: false, errors: { form: "The catalog could not be saved. Try again." } };
  }
  revalidatePath("/admin");
  return { ok: true };
}
