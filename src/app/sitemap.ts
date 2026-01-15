import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://readmystudent.com";

  const routes = [
    "",                // Home
    "/about",
    "/how-it-works",
    "/pricing",
    "/for-students",
    "/for-faculty",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1.0 : 0.7,
  }));
}
