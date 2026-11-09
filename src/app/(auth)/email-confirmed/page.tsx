import { LinkButton } from "@/components/ui/LinkButton";

export default async function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isEmailChange = type === "email_change";

  return (
    <div className='mx-auto grid max-w-xl gap-8 px-5 py-10 md:px-8 md:py-16 xl:max-w-5xl xl:grid-cols-[1fr_30rem] xl:items-start xl:gap-14'>
      <h1 className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'>
        {isEmailChange ? "Email address " : "Email "}
        <span className='text-mint'>{isEmailChange ? "updated" : "confirmed"}</span>
      </h1>
      <div className='sheet p-6 md:p-8'>
        <p className='caption text-sealed'>
          {isEmailChange ? "New address active" : "Account verified"}
        </p>
        <p className='mt-3 text-ink'>
          {isEmailChange
            ? "You can now sign in using your new email address."
            : "Thank you for confirming your email. You can now sign in to your ReadMyStudent account."}
        </p>
        <LinkButton href='/login' variant='gold' size='lg' className='mt-6 w-full'>
          Sign in
        </LinkButton>
      </div>
    </div>
  );
}
