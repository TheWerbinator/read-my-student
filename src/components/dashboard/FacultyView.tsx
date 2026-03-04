"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Clock, FileText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  getPendingDeliveries,
  approveDelivery,
  rejectDelivery,
  type PendingDelivery,
} from "@/app/actions/letters";

export function FacultyView() {
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>(
    [],
  );
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getPendingDeliveries()
      .then(setPendingDeliveries)
      .finally(() => setLoadingDeliveries(false));
  }, []);

  const handleApprove = (id: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await approveDelivery(id);
      if (result.error) {
        setActionError(result.error);
      } else {
        setPendingDeliveries((prev) =>
          prev.filter((d) => d.deliveryLinkId !== id),
        );
      }
    });
  };

  const handleReject = (id: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await rejectDelivery(id);
      if (result.error) {
        setActionError(result.error);
      } else {
        setPendingDeliveries((prev) =>
          prev.filter((d) => d.deliveryLinkId !== id),
        );
      }
    });
  };

  return (
    <div className='space-y-6'>
      {/* Stats Row */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatsCard
          title='Pending Approvals'
          value={loadingDeliveries ? "…" : String(pendingDeliveries.length)}
          icon={Clock}
          color='text-amber-600'
        />
        <StatsCard
          title='Letters Finalized'
          value='—'
          icon={FileText}
          color='text-emerald-600'
        />
        <StatsCard
          title='Avg. Response Time'
          value='—'
          icon={CheckCircle2}
          color='text-blue-600'
        />
      </div>

      <Card className='rounded-2xl border-black/5 bg-green-900/5'>
        <CardContent className='flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-white p-2 text-green-900'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <div>
              <p className='font-semibold text-green-900'>
                Secure letter workflow
              </p>
              <p className='text-sm text-green-900/70'>
                Students never see letter contents. Finalized letters are sealed
                and signed for verification.
              </p>
            </div>
          </div>
          <Button
            variant='outline'
            className='mt-2 rounded-xl border-green-900 text-green-900 hover:bg-green-900/10 sm:mt-0'
          >
            View Verification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Pending delivery approvals */}
      <Card className='rounded-2xl border-black/5 shadow-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-xl text-green-900'>
            Pending Delivery Approvals
          </CardTitle>
          <CardDescription>
            Students have paid to send your letter to a school. Review and
            approve or reject each request. The 48-hour delivery window starts
            only after you approve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionError && (
            <p className='mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>
              ❌ {actionError}
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDeliveries ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-10 text-center text-sm text-gray-400'
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : pendingDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-10 text-center text-sm text-gray-400'
                  >
                    No pending approvals.
                  </TableCell>
                </TableRow>
              ) : (
                pendingDeliveries.map((d) => (
                  <TableRow key={d.deliveryLinkId}>
                    <TableCell className='font-medium'>
                      {d.studentFullName}
                    </TableCell>
                    <TableCell>{d.schoolName}</TableCell>
                    <TableCell className='text-sm text-gray-500'>
                      {new Date(d.paidAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          size='sm'
                          className='rounded-lg bg-green-900 hover:bg-[#093820] text-xs disabled:opacity-50'
                          disabled={isPending}
                          onClick={() => handleApprove(d.deliveryLinkId)}
                        >
                          Approve
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='rounded-lg border-red-200 text-red-600 hover:bg-red-50 text-xs disabled:opacity-50'
                          disabled={isPending}
                          onClick={() => handleReject(d.deliveryLinkId)}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='rounded-2xl border-black/5 shadow-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-xl text-green-900'>
            Incoming Requests
          </CardTitle>
          <CardDescription>
            Students requesting a letter of recommendation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class / Context</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='py-10 text-center text-sm text-gray-400'
                >
                  No pending requests yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='rounded-2xl border-black/5 shadow-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-xl text-green-900'>
            Finalized Letters
          </CardTitle>
          <CardDescription>
            Sealed recommendations ready for secure delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Finalized</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='py-10 text-center text-sm text-gray-400'
                >
                  No finalized letters yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
