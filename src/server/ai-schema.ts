import { z } from "zod";
import { CONTRACT_TYPES, REMOTE_TYPES, SENIORITY_LEVELS } from "@/lib/types";

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .nullable()
    .optional()
    .transform((value) => {
      if (!value) return null;
      const folded = value.trim().toLowerCase();
      return (values as readonly string[]).includes(folded) ? folded : null;
    });

const stringList = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? []);

export const rodiumIntentSchema = z.object({
  keywords: stringList,
  skills: stringList,
  location: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  remoteType: optionalEnum(REMOTE_TYPES),
  contractType: optionalEnum(CONTRACT_TYPES),
  seniority: optionalEnum(SENIORITY_LEVELS),
  language: z.string().nullable().optional(),
});

export const rodiumExtractSchema = z.object({
  title: z.string().trim().min(2).max(200),
  company: z.string().trim().min(2).max(200),
  location: z.string().trim().max(200).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  remoteType: optionalEnum(REMOTE_TYPES),
  contractType: optionalEnum(CONTRACT_TYPES),
  seniority: optionalEnum(SENIORITY_LEVELS),
  skills: stringList,
  languages: stringList,
  description: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  applicationUrl: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export const rodiumCopilotSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
});

export const rodiumNarrativeSchema = z.object({
  narrative: z.string().trim().min(1).max(2000),
});
