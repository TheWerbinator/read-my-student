import { LinkButton } from "@/components/ui/LinkButton";
import Link from "next/link";
import { BoardingPassNav, type PassItem } from "./BoardingPassNav";

const items: PassItem[] = [
  { label: "Home", href: "/", note: "Letters that leave on time" },
  { label: "How it works", href: "/how-it-works", note: "Request, write, seal, send" },
  { label: "Students", href: "/for-students", note: "Ask once, track every letter" },
  { label: "Professors", href: "/for-faculty", note: "One link, no account" },
  { label: "Pricing", href: "/pricing", note: "Professors never pay" },
];

/** The public site's boarding pass. */
export function SiteNav() {
  return (
    <BoardingPassNav
      items={items}
      stub={
        <>
          <LinkButton href='/signup?role=student' variant='gold' size='md' className='w-full'>
            Request a letter
          </LinkButton>
          <Link
            href='/login'
            className='text-center font-display text-lg font-bold uppercase tracking-[0.06em] text-forest-ink underline-offset-4 hover:underline'
          >
            Log in
          </Link>
        </>
      }
    />
  );
}
