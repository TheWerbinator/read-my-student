import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/signin",
        "/signup",
        "/dashboard",
        "/app",
        "/api",
      ],
    },
    sitemap: "https://readmystudent.com/sitemap.xml",
  };
}
