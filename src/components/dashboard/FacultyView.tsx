"use client";

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

export function FacultyView() {
  return (
    <div className='space-y-6'>
      {/* Stats Row */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatsCard
          title='Pending Requests'
          value='0'
          icon={Clock}
          color='text-amber-600'
        />
        <StatsCard
          title='Letters Finalized'
          value='0'
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
