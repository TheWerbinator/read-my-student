import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDb, listCatalog, requireAdmin } from "@/lib/admin";
import { STAGES, formatMoney, type CatalogRow } from "@/lib/catalog";
import { CatalogItemDialog } from "./CatalogItemDialog";

const STAGE_NAMES: Record<CatalogRow["stage"], string> = {
  hs: "High school",
  ug: "Undergraduate",
  masters: "Master's",
  phd: "PhD",
};

const KIND_NAMES: Record<CatalogRow["kind"], string> = {
  membership: "Membership",
  credits: "Extra credit",
  bundle: "Bundle",
  free_allocation: "Free credits",
};

function yearText(row: CatalogRow): string {
  if (row.study_year !== null) return `Year ${row.study_year}`;
  return row.kind === "free_allocation" ? "Once" : "Any year";
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
                  <TableCell className='font-semibold'>{KIND_NAMES[row.kind]}</TableCell>
                  <TableCell>{yearText(row)}</TableCell>
                  <TableCell className='text-right'>{row.credits}</TableCell>
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
                    <CatalogItemDialog row={row} label={`Edit ${STAGE_NAMES[stage]} ${KIND_NAMES[row.kind]}, ${yearText(row)}`} />
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
  if (!(await requireAdmin())) notFound();
  const rows = await listCatalog(adminDb());

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
          <StageSheet key={stage} stage={stage} rows={rows.filter((r) => r.stage === stage)} />
        ))}
      </div>
    </div>
  );
}
