import type { Metadata } from "next";
import { getUserRole } from "@/app/actions/user";
import { LinkButton } from "@/components/ui/LinkButton";
import { ConnectButton } from "./ConnectButton";

export const metadata: Metadata = { title: "Connect the extension", robots: { index: false } };

// The token goes to the extension's content script on this page (extension/entrypoints/connect.content.ts).
export default async function ExtensionConnectPage() {
  const role = await getUserRole();

  let body: React.ReactNode;
  if (role === "FACULTY") {
    body = <ConnectButton />;
  } else if (role === "STUDENT") {
    body = <p className='mt-3 text-ink'>The extension is for professors. This account is a student account.</p>;
  } else {
    body = (
      <>
        <p className='mt-3 text-ink'>
          Log in to your professor account first. Then click Connect in the extension again.
        </p>
        <LinkButton href='/login' variant='gold' size='lg' className='mt-6 w-full'>
          Log in
        </LinkButton>
      </>
    );
  }

  return (
    <div className='mx-auto grid max-w-xl gap-8 px-5 py-10 md:px-8 md:py-16 xl:max-w-5xl xl:grid-cols-[1fr_30rem] xl:items-start xl:gap-14'>
      <h1 className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'>
        Connect the <span className='text-gold'>extension</span>
      </h1>
      <div className='sheet p-6 md:p-8'>
        <p className='caption text-ink-2'>Browser extension</p>
        {body}
      </div>
    </div>
  );
}
