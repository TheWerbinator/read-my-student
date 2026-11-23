import { PhotoPrint } from "./PhotoPrint";
import { PHOTOS } from "./photos";

/** Home: the professor-student relationship behind every letter. Hidden until its photo exists. */
export default function KnowsYourWork() {
  const photo = PHOTOS.home;
  if (!photo) return null;
  return (
    <section aria-labelledby='work-heading' className='px-5 py-16 md:px-8 md:py-24'>
      <div className='mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-12 lg:gap-12'>
        <div className='lg:col-span-5'>
          <h2
            id='work-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
          >
            It starts with a professor who knows your work.
          </h2>
          <p className='mt-6 max-w-xl text-lg leading-relaxed text-flap-ink/90'>
            The letter that counts comes from someone who watched you work through a hard problem. ReadMyStudent asks that professor once, by email, and keeps the request moving until the letter is sealed.
          </p>
        </div>
        <PhotoPrint photo={photo} sizes='(min-width: 1024px) 42rem, 100vw' className='lg:order-first lg:col-span-7' />
      </div>
    </section>
  );
}
