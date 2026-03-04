import { Suspense } from "react";
import { getUserRole } from "@/app/actions/user";
import { FacultyView } from "@/components/dashboard/FacultyView";
import { StudentView } from "@/components/dashboard/StudentView";

async function DashboardContent() {
  const role = await getUserRole();

  return (
    <>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='font-serif text-3xl font-semibold text-green-900'>
            {role === "STUDENT" ? "Student Dashboard" : "Faculty Dashboard"}
          </h1>
          <p className='text-green-900/70'>
            {role === "STUDENT"
              ? "Manage your requests and send letters to institutions."
              : "Review pending requests and draft recommendations."}
          </p>
        </div>
      </div>

      {role === "STUDENT" ? (
        <StudentView />
      ) : role === "FACULTY" ? (
        <FacultyView />
      ) : (
        <p className='text-center text-gray-500 py-24'>
          Unable to determine your account role. Please contact support.
        </p>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Header skeleton */}
      <div className='flex flex-col gap-2'>
        <div className='h-9 w-56 rounded-lg bg-green-900/10 animate-pulse' />
        <div className='h-4 w-80 rounded-md bg-green-900/10 animate-pulse' />
      </div>

      {/* Content skeleton — mirrors the two-column student/faculty layout */}
      <div className='grid gap-6 grid-cols-1 md:grid-cols-12'>
        {/* Left card */}
        <div className='md:col-span-4 rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/5 p-6 space-y-4'>
          <div className='h-5 w-36 rounded-md bg-gray-200 animate-pulse' />
          <div className='h-3 w-48 rounded-md bg-gray-100 animate-pulse' />
          <div className='space-y-3 pt-2'>
            <div className='h-3 w-24 rounded bg-gray-200 animate-pulse' />
            <div className='h-10 rounded-xl bg-gray-100 animate-pulse' />
            <div className='h-3 w-36 rounded bg-gray-200 animate-pulse' />
            <div className='h-10 rounded-xl bg-gray-100 animate-pulse' />
            <div className='h-3 w-28 rounded bg-gray-200 animate-pulse' />
            <div className='h-24 rounded-xl bg-gray-100 animate-pulse' />
            <div className='h-10 rounded-xl bg-green-900/20 animate-pulse' />
          </div>
        </div>

        {/* Right card */}
        <div className='md:col-span-8 rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/5 p-6 space-y-4'>
          <div className='flex gap-2'>
            <div className='h-9 flex-1 rounded-lg bg-gray-100 animate-pulse' />
            <div className='h-9 flex-1 rounded-lg bg-gray-100 animate-pulse' />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex gap-4 py-3 border-b border-gray-100'>
              <div className='h-4 flex-1 rounded bg-gray-100 animate-pulse' />
              <div className='h-4 w-24 rounded bg-gray-100 animate-pulse' />
              <div className='h-4 w-20 rounded bg-gray-100 animate-pulse' />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className='min-h-screen bg-[#fbfbf8] p-6 md:p-10'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
