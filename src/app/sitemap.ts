import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const lastModified = new Date();
  return [
    { url: base, lastModified },
    { url: `${base}/search`, lastModified },
    { url: `${base}/jobs`, lastModified },
    { url: `${base}/privacy`, lastModified },
    { url: `${base}/terms`, lastModified },
    { url: `${base}/sign-in`, lastModified },
    { url: `${base}/sign-up`, lastModified },
  ];
}
