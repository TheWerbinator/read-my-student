import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isEmailChange = type === "email_change";

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          <Card className='rounded-3xl border-black/10 bg-white shadow-xl shadow-black/5'>
            <CardHeader className='pb-2'>
              <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
                <svg
                  className='h-6 w-6 text-green-700'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2.5}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M4.5 12.75l6 6 9-13.5'
                  />
                </svg>
              </div>
              <CardTitle className='font-serif text-2xl font-semibold text-green-900'>
                {isEmailChange ? "Email address updated!" : "Email confirmed!"}
              </CardTitle>
              <CardDescription className='text-green-900/70'>
                {isEmailChange
                  ? "Your new email address is now active."
                  : "Your account is verified and ready to use."}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 pt-2'>
              <p className='text-sm text-gray-600'>
                {isEmailChange
                  ? "You can now sign in using your new email address."
                  : "Thank you for confirming your email. You can now sign in to your ReadMyStudent account."}
              </p>
              <Link
                href='/login'
                className='block w-full rounded-xl bg-green-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-green-800 transition-colors'
              >
                Sign in
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
