import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /r and /view stay crawlable so their noindex meta is seen.
      disallow: ["/dashboard", "/api"],
    },
    sitemap: "https://www.readmystudent.com/sitemap.xml",
  };
}
