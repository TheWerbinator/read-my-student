import { LinkButton } from "../ui/LinkButton";
import { FlapText } from "../board/FlapText";
import { DepartureBoard, type DepartureRow } from "../board/DepartureBoard";

// Illustrative rows: invented names and times, labelled "Sample board" on the page.
const sampleRows: DepartureRow[] = [
  { time: "09:14", student: "Priya S.", professor: "Dr. Reyes", school: "Toronto", status: "Sealed", lamp: "done" },
  { time: "09:22", student: "Arjun M.", professor: "Prof. Iyer", school: "Purdue", status: "Opened", lamp: "moving" },
  { time: "10:05", student: "Mei L.", professor: "Dr. Okafor", school: "TU Munich", status: "Sent", lamp: "done" },
  { time: "10:31", student: "Sofia R.", professor: "Prof. Kane", school: "UCL", status: "Requested", lamp: "moving" },
  { time: "11:02", student: "Dev P.", professor: "Dr. Rao", school: "ASU", status: "Reminded", lamp: "waiting" },
];

export default function Hero() {
  return (
    <section className='relative overflow-hidden px-5 pb-16 pt-8 md:px-8 lg:pt-16 lg:pb-24'>
      <div className='mx-auto grid max-w-6xl items-start gap-12 xl:grid-cols-12 xl:gap-10'>
        {/* Owner ruling: the headline stays sized to its column beside the board. */}
        <div className='xl:col-span-6'>
          <h1 className='@container font-display font-extrabold leading-none'>
            <span className='flex flex-col gap-[0.12em] text-[min(calc(100cqi/10.7),4.75rem)]'>
              <FlapText text='Letters that' cascadeOnMount />
              <FlapText text='leave on' cascadeOnMount delay={250} />
              <FlapText text='time.' cascadeOnMount delay={500} className='text-gold' />
            </span>
          </h1>

          <p className='mt-8 max-w-xl text-lg leading-relaxed text-flap-ink/90 md:text-xl'>
            Ask your professor once. They get one link, write without an account, and seal the letter. You send it to every school from here.
          </p>

          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <LinkButton href='/signup?role=student' variant='gold' size='lg'>
              Request a letter
            </LinkButton>
            <LinkButton href='/for-faculty' variant='board' size='lg'>
              I am a professor
            </LinkButton>
          </div>
        </div>

        <div className='min-w-0 max-w-xl xl:col-span-6 xl:max-w-none xl:pt-3'>
          <DepartureBoard title='Letter departures' note='Sample board' rows={sampleRows} mobileRows={3} />
        </div>
      </div>
    </section>
  );
}
