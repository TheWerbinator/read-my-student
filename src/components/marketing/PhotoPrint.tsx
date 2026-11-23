import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Photo } from "./photos";

/**
 * A photo printed on a paper sheet laid on the board, with a perforated caption
 * stub like a boarding pass. The caption names the scene and credits the source.
 */
export function PhotoPrint({ photo, sizes, className }: { photo: Photo; sizes: string; className?: string }) {
  return (
    <figure className={cn("sheet p-3 md:p-4", className)}>
      <div className='relative aspect-[3/2] overflow-hidden rounded-[1px] bg-paper-2'>
        <Image src={photo.image} alt={photo.alt} fill sizes={sizes} placeholder='blur' className='object-cover' />
      </div>
      {/* The notches sit on the sheet's edges, so the tear line runs edge to edge. */}
      <div aria-hidden='true' className='perforation -mx-3 mt-4 md:-mx-4 md:mt-5' />
      <figcaption className='flex items-end justify-between gap-6 px-1 pb-1 pt-4'>
        <span className='min-w-0'>
          <span className='caption block text-ink-2'>Scene</span>
          <span className='mt-1 block text-base font-semibold text-ink'>{photo.scene}</span>
        </span>
        <span className='min-w-0 text-right'>
          <span className='caption block text-ink-2'>Photo</span>
          <span className='mt-1 block text-sm text-ink-2'>{photo.credit}</span>
        </span>
      </figcaption>
    </figure>
  );
}
