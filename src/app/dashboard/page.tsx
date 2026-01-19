"use client";

import { useState } from "react";
import {
  FileText,
  Send,
  Clock,
  CheckCircle2,
  Upload,
  School,
  Plus,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// MOCK DATA - Replace with real Supabase data fetch
const MOCK_USER_ROLE = "STUDENT"; // Change to 'FACULTY' to see the other view

export default function DashboardPage() {
  // In real app: const { user } = useAuth();
  const role = MOCK_USER_ROLE;

  return (
    <div className='min-h-screen bg-[#fbfbf8] p-6 md:p-10'>
      <div className='mx-auto max-w-6xl space-y-8'>
        {/* Header Section */}
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='font-serif text-3xl font-semibold text-[#0b4726]'>
              {role === "STUDENT" ? "Student Dashboard" : "Faculty Dashboard"}
            </h1>
            <p className='text-[#0b4726]/70'>
              {role === "STUDENT"
                ? "Manage your requests and send letters to institutions."
                : "Review pending requests and upload recommendations."}
            </p>
          </div>
          {role === "STUDENT" && (
            <Button className='bg-[#eebd32] text-[#0b4726] hover:bg-[#d4a728] font-semibold rounded-xl'>
              <Plus className='mr-2 h-4 w-4' /> New Request
            </Button>
          )}
        </div>

        {/* Dynamic Dashboard Content */}
        {role === "STUDENT" ? <StudentView /> : <FacultyView />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STUDENT VIEW                                */
/* -------------------------------------------------------------------------- */

function StudentView() {
  return (
    <div className='grid gap-6 md:grid-cols-12'>
      {/* LEFT COL: Request Form */}
      <div className='md:col-span-4'>
        <Card className='rounded-2xl border-black/5 shadow-lg shadow-black/5'>
          <CardHeader>
            <CardTitle className='text-xl font-serif text-[#0b4726]'>
              Request a Letter
            </CardTitle>
            <CardDescription>
              Ask a professor for a recommendation.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='prof-email'>Professor&apos;s Email</Label>
              <Input
                id='prof-email'
                placeholder='professor@university.edu'
                className='rounded-xl border-black/10 focus-visible:ring-[#0b4726]'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='course'>Course / Context (Optional)</Label>
              <Input
                id='course'
                placeholder='e.g. BIO 101, Fall 2023'
                className='rounded-xl border-black/10 focus-visible:ring-[#0b4726]'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='message'>Personal Note</Label>
              <Textarea
                id='message'
                placeholder="Hi Professor, I'm applying to med school..."
                className='rounded-xl border-black/10 min-h-[100px] focus-visible:ring-[#0b4726]'
              />
            </div>
            <Button className='w-full rounded-xl bg-[#0b4726] hover:bg-[#093820]'>
              Send Request
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COL: Status Tabs */}
      <div className='md:col-span-8'>
        <Tabs defaultValue='completed' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 rounded-xl bg-[#0b4726]/5 p-1'>
            <TabsTrigger
              value='completed'
              className='rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0b4726] data-[state=active]:shadow-sm'
            >
              Ready to Send
            </TabsTrigger>
            <TabsTrigger
              value='pending'
              className='rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0b4726] data-[state=active]:shadow-sm'
            >
              Pending
            </TabsTrigger>
          </TabsList>

          {/* COMPLETED REQUESTS (Ready to send to schools) */}
          <TabsContent value='completed' className='mt-4 space-y-4'>
            <Card className='rounded-2xl border-black/5'>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead>Professor</TableHead>
                      <TableHead>Date Signed</TableHead>
                      <TableHead className='text-right'>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2].map((i) => (
                      <TableRow key={i} className='group'>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-3'>
                            <div className='h-8 w-8 rounded-full bg-[#0b4726]/10 grid place-items-center text-[#0b4726] font-bold text-xs'>
                              JD
                            </div>
                            <span>Dr. Jane Doe</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-gray-500'>
                          Oct 24, 2024
                        </TableCell>
                        <TableCell className='text-right'>
                          <SendToSchoolDialog />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PENDING REQUESTS */}
          <TabsContent value='pending' className='mt-4'>
            <Card className='rounded-2xl border-black/5'>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead>Professor</TableHead>
                      <TableHead>Sent On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>
                        Dr. Alan Grant
                      </TableCell>
                      <TableCell className='text-gray-500'>
                        Nov 1, 2024
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='secondary'
                          className='bg-amber-100 text-amber-800 hover:bg-amber-100'
                        >
                          <Clock className='mr-1 h-3 w-3' /> Awaiting
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FACULTY VIEW                                */
/* -------------------------------------------------------------------------- */

function FacultyView() {
  return (
    <div className='space-y-6'>
      {/* Stats Row */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatsCard
          title='Pending Requests'
          value='3'
          icon={Clock}
          color='text-amber-600'
        />
        <StatsCard
          title='Letters Written'
          value='24'
          icon={FileText}
          color='text-[#0b4726]'
        />
        <StatsCard
          title='Avg. Response Time'
          value='2 Days'
          icon={CheckCircle2}
          color='text-blue-600'
        />
      </div>

      <Card className='rounded-2xl border-black/5 shadow-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-xl text-[#0b4726]'>
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
                <TableHead>Requested On</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <div className='font-medium'>Alex Smith</div>
                      <div className='text-xs text-gray-500'>
                        alex@university.edu
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>BIO 201 (Fall 23)</TableCell>
                  <TableCell className='text-gray-500'>2 days ago</TableCell>
                  <TableCell className='text-right'>
                    <UploadRecommendationDialog studentName='Alex Smith' />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DIALOG COMPONENTS                               */
/* -------------------------------------------------------------------------- */

function SendToSchoolDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size='sm'
          className='rounded-lg bg-[#eebd32] text-[#0b4726] hover:bg-[#d4a728] font-semibold'
        >
          <School className='mr-2 h-4 w-4' /> Send to School
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-[#0b4726]'>
            Send Recommendation
          </DialogTitle>
          <DialogDescription>
            Enter the destination email for the admissions office.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='school-name'>Institution Name</Label>
            <Input
              id='school-name'
              placeholder='e.g. Harvard Medical School'
              className='rounded-xl'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='school-email'>Admissions Email</Label>
            <Input
              id='school-email'
              placeholder='admissions@harvard.edu'
              className='rounded-xl'
            />
          </div>
          <div className='rounded-lg bg-slate-50 p-3 text-xs text-gray-500'>
            <span className='font-bold text-[#0b4726]'>Note:</span> This will
            generate a secure, one-time view link for the institution.
          </div>
        </div>
        <DialogFooter>
          <Button
            type='submit'
            className='w-full rounded-xl bg-[#0b4726] hover:bg-[#093820]'
          >
            Send Secure Link ($5.00)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadRecommendationDialog({ studentName }: { studentName: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          className='rounded-lg border-[#0b4726] text-[#0b4726] hover:bg-[#0b4726]/5'
        >
          <Upload className='mr-2 h-4 w-4' /> Upload Letter
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px] rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-[#0b4726]'>
            Upload Letter for {studentName}
          </DialogTitle>
          <DialogDescription>
            Upload a PDF file. The student will not be able to see this file.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-6 py-4'>
          <div className='flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'>
            <FileText className='h-8 w-8 text-gray-400 mb-2' />
            <div className='text-sm font-medium text-gray-600'>
              Click to select PDF
            </div>
            <div className='text-xs text-gray-400'>Max file size 5MB</div>
          </div>

          <div className='flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800'>
            <CheckCircle2 className='h-5 w-5 shrink-0' />
            <p>
              By uploading, you certify that this letter is your honest
              assessment and was written without the student&apos;s input.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type='submit'
            className='w-full rounded-xl bg-[#0b4726] hover:bg-[#093820]'
          >
            Submit Recommendation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className='rounded-2xl border-black/5 shadow-sm'>
      <CardContent className='flex items-center gap-4 p-6'>
        <div
          className={`rounded-full p-3 bg-opacity-10 ${color.replace("text-", "bg-")}`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className='text-sm font-medium text-gray-500'>{title}</p>
          <h4 className='text-2xl font-bold text-[#0b4726]'>{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
}
