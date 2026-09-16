import { z } from "zod";
import { officialApplicationUrl, officialLogoUrl } from "@/lib/jobs";
import { CONTRACT_TYPES, REMOTE_TYPES, SENIORITY_LEVELS } from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    return value.toLowerCase() === "not specified" ? null : value;
  });

const optionalHttpUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => officialApplicationUrl(value));

const optionalLogoUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => officialLogoUrl(value));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  });

const optionalInt = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
    return Number.isFinite(n) ? Math.round(n) : null;
  });

export const opportunityFormSchema = z.object({
  title: z.string().trim().min(2).max(200),
  company: z.string().trim().min(2).max(200),
  companyLogo: optionalLogoUrl,
  contractType: z.enum(CONTRACT_TYPES).optional().nullable(),
  location: z.string().trim().min(1).max(200),
  remoteType: z.enum(REMOTE_TYPES).optional().nullable(),
  description: z.string().trim().min(10).max(20000),
  postedAt: optionalDate,
  deadline: optionalDate,
  startDate: optionalDate,
  endDate: optionalDate,
  duration: optionalText,
  sourceUrl: optionalHttpUrl,
  applicationUrl: optionalHttpUrl,
  skills: optionalText,
  education: optionalText,
  experience: optionalText,
  seniority: z.enum(SENIORITY_LEVELS).optional().nullable(),
  salaryMin: optionalInt,
  salaryMax: optionalInt,
  currency: optionalText,
  benefits: optionalText,
  language: optionalText,
  country: optionalText,
  contactInfo: optionalText,
  requirements: optionalText,
  publishNow: z.boolean().optional(),
  category: optionalText,
  source: optionalText,
  status: z.enum(["pending", "published", "unpublished", "archived"]).optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;
