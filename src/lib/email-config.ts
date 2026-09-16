import { appUrl, adminEmail } from "@/lib/env";

export function gmailUser(): string | null {
  return process.env.GMAIL_USER?.trim() || null;
}

export function gmailAppPassword(): string | null {
  const value = process.env.GMAIL_APP_PASSWORD?.trim() || null;
  return value;
}

export function emailFromName(): string {
  return process.env.EMAIL_FROM_NAME?.trim() || "JobRadar";
}

export function isGmailConfigured(): boolean {
  return Boolean(gmailUser() && gmailAppPassword());
}

export function emailFromAddress(): string {
  const user = gmailUser();
  const name = emailFromName();
  return user ? `${name} <${user}>` : name;
}

export function absoluteAppUrl(path = "/"): string {
  const base = appUrl();
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

export function testEmailRecipient(): string | null {
  return adminEmail() || gmailUser();
}
