import { Suspense } from "react";
import { getUserRole } from "@/app/actions/user";
import { FacultyView } from "@/components/dashboard/FacultyView";
import { StudentView } from "@/components/dashboard/StudentView";
import { BoardSkeleton } from "@/components/dashboard/StatsCard";

async function DashboardContent() {
  const role = await getUserRole();

  return (
    <>
      <div>
        <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-flap-ink md:text-3xl'>
          {role === "STUDENT" ? "Student Dashboard" : "Professor Dashboard"}
        </h1>
        <p className='mt-2 text-flap-dim'>
          {role === "STUDENT"
            ? "Manage your requests and send letters to institutions."
            : "Review pending requests and draft recommendations."}
        </p>
      </div>

      {role === "STUDENT" ? (
        <StudentView />
      ) : role === "FACULTY" ? (
        <FacultyView />
      ) : (
        <p className='py-24 text-center text-flap-dim'>
          Unable to determine your account role. Please contact support.
        </p>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className='space-y-2' aria-hidden='true'>
        <div className='h-8 w-56 bg-flap-ink/10 motion-safe:animate-pulse' />
        <div className='h-4 w-80 max-w-full bg-flap-ink/10 motion-safe:animate-pulse' />
      </div>
      <div className='board-frame'>
        <BoardSkeleton rows={4} />
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className='p-6 md:p-10'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
