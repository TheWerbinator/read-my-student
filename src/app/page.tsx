import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl gap-12 flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="text-6xl text-indigo-600 text-center">Yo uh yea, Readmystudent</div>
        <Link className="mx-auto border rounded-xl hover:bg-indigo-600 hover:border-indigo-600 p-4" href={"/auth"}>Go to the Authentication Page</Link>
      </main>
    </div>
  );
}
