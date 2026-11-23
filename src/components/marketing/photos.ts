// Photo slots on the marketing pages. A slot set to null renders nothing, so no
// page ships an empty frame. To fill a slot, follow docs/photos.md: put the file
// in src/assets/photos/, import it here, and replace null.

import type { StaticImageData } from "next/image";

export type Photo = {
  image: StaticImageData;
  /** What the photo shows, for screen readers. Write it for this photo. */
  alt: string;
  /** A short scene label printed under the photo. Never a person's name without their written consent. */
  scene: string;
  /** Photographer and source, printed under the photo, for example "Jane Doe / Unsplash". */
  credit: string;
};

export const PHOTOS: Record<"home" | "students" | "facultyDesk" | "facultyFamily" | "about", Photo | null> = {
  // Home, after the hero: a professor and a student going over work together.
  home: null,
  // For students, "You may not read it": a student working on applications.
  students: null,
  // For professors, "Four things you can do": a professor writing at a desk.
  facultyDesk: null,
  // For professors, "Free for your family": a parent and a teenager at home with a laptop.
  facultyFamily: null,
  // About: the real people behind ReadMyStudent. A real photo only, never stock.
  about: null,
};
