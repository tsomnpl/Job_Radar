import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/cv", "/saved-jobs", "/applications", "/api/"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
