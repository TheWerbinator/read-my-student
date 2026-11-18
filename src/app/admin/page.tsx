import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDb, adminSession, listCatalog } from "@/lib/admin";
import { STAGES, formatMoney, type CatalogRow } from "@/lib/catalog";
import { formatDate } from "@/lib/format-date";
import { CatalogItemDialog } from "./CatalogItemDialog";
import { DependentInviteForm } from "./DependentInviteForm";

const STAGE_NAMES: Record<CatalogRow["stage"], string> = {
  hs: "High school",
  ug: "Undergraduate",
  masters: "Master's",
  phd: "PhD or working professional",
};

const KIND_NAMES: Record<CatalogRow["kind"], string> = {
  membership: "Membership",
  credits: "Extra credit",
  bundle: "Bundle",
  free_allocation: "Free credits",
};

function itemName(row: CatalogRow): string {
  if (row.kind !== "credits") return KIND_NAMES[row.kind];
  return row.members_only ? "Extra credit (members)" : "Pay as you go";
}

function yearText(row: CatalogRow): string {
  if (row.study_year !== null) return `Year ${row.study_year}`;
  if (row.kind !== "free_allocation") return "Any year";
  return row.stage === "hs" ? "Every year" : "Once";
}

function expiryText(row: CatalogRow): string {
  if (row.expiry === "never") return "Never";
  if (row.expiry === "end_of_year") return "End of that year";
  return `End of Year ${row.expiry_year}`;
}

function Price({ minor, currency, free }: { minor: number | null; currency: "USD" | "INR"; free: boolean }) {
  if (free) return <span className='text-ink-2'>Free</span>;
  const text = formatMoney(minor, currency);
  return text ? <>{text}</> : <span className='font-semibold text-waiting'>Not set</span>;
}

function StageSheet({ stage, rows }: { stage: CatalogRow["stage"]; rows: CatalogRow[] }) {
  return (
    <section aria-labelledby={`stage-${stage}`} className='sheet p-6'>
      <h2
        id={`stage-${stage}`}
        className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'
      >
        {STAGE_NAMES[stage]}
      </h2>
      {rows.length === 0 ? (
        <p className='mt-4 text-ink-2'>No items for this stage yet. Use Add item to create one.</p>
      ) : (
        <Table className='mt-4'>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className='text-right'>Credits</TableHead>
              <TableHead className='text-right'>USD</TableHead>
              <TableHead className='text-right'>INR</TableHead>
              <TableHead>Credits expire</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className='sr-only'>Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const free = row.kind === "free_allocation";
              return (
                <TableRow key={row.id} className={row.active ? undefined : "text-ink-2"}>
                  <TableCell className='font-semibold'>{itemName(row)}</TableCell>
                  <TableCell>{yearText(row)}</TableCell>
                  <TableCell className='text-right'>
                    {row.credits}
                    {row.free_credits > 0 && <span className='block text-ink-2'>+{row.free_credits} free</span>}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Price minor={row.price_usd_cents} currency='USD' free={free} />
                  </TableCell>
                  <TableCell className='text-right'>
                    <Price minor={row.price_inr_paise} currency='INR' free={free} />
                  </TableCell>
                  <TableCell>{expiryText(row)}</TableCell>
                  <TableCell>
                    {row.active ? <Badge>On sale</Badge> : <Badge variant='outline'>Off</Badge>}
                  </TableCell>
                  <TableCell className='text-right'>
                    <CatalogItemDialog row={row} label={`Edit ${STAGE_NAMES[stage]} ${itemName(row)}, ${yearText(row)}`} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

export default async function AdminCatalogPage() {
  const session = await adminSession();
  if (!session) notFound();
  // Before the code step the layout shows MfaGate instead of this page, so render nothing.
  if (!session.mfa) return null;
  const db = adminDb();
  const rows = await listCatalog(db);
  const { data: invites, error: invitesError } = await db
    .from("dependent_invites")
    .select("id, email, dependent_name, created_at, used_at")
    .order("created_at", { ascending: false });
  if (invitesError) throw invitesError;

  return (
    <div className='p-6 md:p-10'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-flap-ink md:text-3xl'>
              Price <span className='text-gold'>catalog</span>
            </h1>
            <p className='mt-2 max-w-prose text-flap-dim'>
              Prices and credits for each plan. A change applies to new purchases and new grants. Credits a student already has keep their amount and end date.
            </p>
          </div>
          <CatalogItemDialog row={null} label='Add item' />
        </div>
        {STAGES.map((stage) => (
          <StageSheet
            key={stage}
            stage={stage}
            // Yearly free rows switched off by migration 20261116000000: their credits moved onto the memberships.
            rows={rows.filter((r) => r.stage === stage && !(r.kind === "free_allocation" && r.study_year !== null && !r.active))}
          />
        ))}

        <section aria-labelledby='dependents' className='sheet p-6'>
          <h2
            id='dependents'
            className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-forest-ink'
          >
            Faculty dependents
          </h2>
          <p className='mt-2 max-w-prose text-ink-2'>
            When a professor emails us a dependent&apos;s name and email, send the invite here. The professor must have an account. The dependent&apos;s requests are free for 3 years from the first time they open the dashboard with a confirmed email.
          </p>
          <DependentInviteForm />
          {(invites ?? []).length > 0 && (
            <Table className='mt-6'>
              <TableHeader>
                <TableRow>
                  <TableHead>Dependent</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invites ?? []).map((i) => (
                  <TableRow key={i.id as string}>
                    <TableCell className='font-semibold'>{i.dependent_name as string}</TableCell>
                    <TableCell>{i.email as string}</TableCell>
                    <TableCell>{formatDate(i.created_at as string)}</TableCell>
                    <TableCell>
                      {i.used_at ? <Badge>Claimed {formatDate(i.used_at as string)}</Badge> : <Badge variant='outline'>Waiting</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}
