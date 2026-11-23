# Marketing photos

The marketing site has five photo slots. Each slot stays hidden until it has an approved photo, so no page shows an empty frame. Each photo appears as a print on a white sheet. A perforated caption stub under the photo names the scene and credits the source.

## The five slots

All slots use a 3:2 landscape crop. The widest slot shows at about 670 CSS pixels, so a file at least 2000 pixels wide stays sharp on high-density phones and laptops. The site converts each photo to AVIF or WebP and serves the size each screen needs.

| Slot | Page and place | What the photo shows |
|---|---|---|
| `home` | Home, after the hero, beside "It starts with a professor who knows your work." | A professor and one student going over work together at a desk or a whiteboard, in a real office or lab. Both faces visible, mid-conversation, not posed for the camera. |
| `students` | For students, under "You may not read it." | A student alone at a laptop or with papers, working on applications. Evening or library light. |
| `facultyDesk` | For professors, under "Four things you can do." | A professor writing at a desk: a laptop, papers, books. Calm and ordinary, not a lecture hall. |
| `facultyFamily` | For professors, under "Free for your family." | A parent and a teenager at a kitchen table with a laptop, working on something together. |
| `about` | About, under the three paragraphs. | The real people who run ReadMyStudent. Use a real photo only, never stock, because the page is about the company. |

Rules for every photo:

1. Use people who look like the students the site serves. India is the largest market, and students apply to schools in the US and abroad.
2. Do not use photos that contain readable text, logos, or a university's name or crest. Text in a photo cannot be read by screen readers, and a crest suggests a partnership that does not exist.
3. Do not put a person's name in the caption unless that person agreed in writing.
4. Do not use a photo of a real, named person found in news or event coverage. A sales page with that person on it suggests that they endorse the product.

## Where to get photos

Your own photos are the best choice. Get a signed release from each person in the photo.

Unsplash and Pexels allow free commercial use without credit, but they do not promise that the people in a photo agreed to commercial use:

- Unsplash: "No permission needed (though attribution is appreciated!)" (https://unsplash.com/license). Its help center adds that "if there's an identifiable person in the image, you may need his or her permission before you can use the image in certain ways", and "We cannot make any guarantees about the scope of permitted uses" (https://help.unsplash.com/en/articles/2646379-what-if-there-s-a-brand-or-identifiable-person-depicted-in-an-image-that-i-download, https://help.unsplash.com/en/articles/2612329-releases-and-trademarks).
- Pexels: "Attribution is not required." It also says "Don't imply endorsement of your product by people or brands on the imagery" (https://www.pexels.com/license/).

[UNVERIFIED] Paid stock libraries (Adobe Stock, Shutterstock, Getty Images) often sell photos with model releases for commercial use. Check the release on each photo before you buy it.

Claude could not search Unsplash from this machine, because the site shows a browser check to automated clients. Openverse, a public search of openly licensed photos, returned mostly event photos of named people, which rule 4 excludes. If you send the Unsplash or Pexels page links of the photos you like, Claude can download them and fill the slots.

## Add a photo

1. Save the file in `src/assets/photos/`, for example `src/assets/photos/home.jpg`. Use a JPEG of at least 2000 pixels wide.
2. Open `src/components/marketing/photos.ts`. Add an import at the top and replace the slot's `null`:

```ts
import home from "@/assets/photos/home.jpg";

// in PHOTOS:
home: {
  image: home,
  alt: "A professor and a student go over a page of notes at a desk.",
  scene: "Office hours",
  credit: "Jane Doe / Unsplash",
},
```

3. Write `alt` for this photo: say what it shows, in one sentence. Write `scene` in two or three words. Put the photographer and the source in `credit`, even when the license does not require it.
4. Run `npm run build` and look at the page.

To replace a stock photo with your own photo later, change the file and the import. The `alt`, `scene`, and `credit` must change with it.
