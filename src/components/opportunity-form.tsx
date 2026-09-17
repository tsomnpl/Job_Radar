"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobRecord } from "@/lib/types";

function isoDate(value?: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function OpportunityForm({ job }: { job?: JobRecord }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [durationSpecified, setDurationSpecified] = useState(Boolean(job?.duration));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      company: String(form.get("company") ?? ""),
      companyLogo: String(form.get("companyLogo") ?? ""),
      contractType: String(form.get("contractType") ?? "other"),
      location: String(form.get("location") ?? ""),
      remoteType: String(form.get("remoteType") ?? "unspecified"),
      description: String(form.get("description") ?? ""),
      postedAt: String(form.get("postedAt") ?? ""),
      deadline: String(form.get("deadline") ?? ""),
      startDate: String(form.get("startDate") ?? ""),
      endDate: String(form.get("endDate") ?? ""),
      duration: durationSpecified ? String(form.get("duration") ?? "") : "",
      sourceUrl: String(form.get("sourceUrl") ?? ""),
      applicationUrl: String(form.get("applicationUrl") ?? ""),
      skills: String(form.get("skills") ?? ""),
      education: String(form.get("education") ?? ""),
      experience: String(form.get("experience") ?? ""),
      seniority: String(form.get("seniority") ?? "unspecified"),
      salaryMin: String(form.get("salaryMin") ?? ""),
      salaryMax: String(form.get("salaryMax") ?? ""),
      currency: String(form.get("currency") ?? ""),
      benefits: String(form.get("benefits") ?? ""),
      language: String(form.get("language") ?? ""),
      country: String(form.get("country") ?? ""),
      contactInfo: String(form.get("contactInfo") ?? ""),
      requirements: String(form.get("requirements") ?? ""),
      category: String(form.get("category") ?? ""),
      source: String(form.get("source") ?? ""),
      status: String(form.get("status") ?? ""),
      publishNow: form.get("publishNow") === "on" || String(form.get("status") ?? "") === "published",
    };
    const endpoint = job ? `/api/admin/jobs/${job.id}` : "/api/admin/jobs";
    const response = await fetch(endpoint, {
      method: job ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setStatus(data.error === "INVALID_INPUT" ? "Vérifiez les champs obligatoires et les URLs http(s)." : "Enregistrement impossible.");
      return;
    }
    router.push("/admin?tab=opportunities");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="panel space-y-4 p-6">
        <h2 className="font-semibold">Informations principales</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Title / Position
            <input name="title" required defaultValue={job?.title} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Company / Organization
            <input name="company" required defaultValue={job?.company} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            Company logo URL
            <input
              name="companyLogo"
              type="url"
              placeholder="https://…"
              defaultValue={job?.companyLogo ?? ""}
              className="field mt-1 w-full rounded-xl px-3 py-2"
            />
            <span className="mt-1 block text-xs text-muted">URL http(s) seulement. Pas d&apos;upload fichier (pas de stockage image).</span>
          </label>
          <label className="text-sm">
            Opportunity type
            <select name="contractType" defaultValue={job?.contractType ?? "other"} className="field mt-1 w-full rounded-xl px-3 py-2">
              <option value="internship">Internship</option>
              <option value="employee">Job / Employee</option>
              <option value="consultant">Consultant</option>
              <option value="freelance">Freelance</option>
              <option value="mission">Mission</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm">
            Category
            <select name="category" defaultValue={job?.category ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2">
              <option value="">Not specified</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="data">Data</option>
              <option value="engineering">Engineering</option>
              <option value="product">Product</option>
              <option value="business">Business</option>
              <option value="ong">NGO / ONG</option>
              <option value="international">International</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm">
            Location
            <input name="location" required defaultValue={job?.location} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Remote / Hybrid / On-site
            <select name="remoteType" defaultValue={job?.remoteType ?? "unspecified"} className="field mt-1 w-full rounded-xl px-3 py-2">
              <option value="unspecified">Not specified</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </label>
          <label className="text-sm">
            Country
            <input name="country" defaultValue={job?.country ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            Description
            <textarea name="description" required rows={8} defaultValue={job?.description} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="font-semibold">Dates & duration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Publication date
            <input name="postedAt" type="date" defaultValue={isoDate(job?.postedAt)} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Application deadline
            <input name="deadline" type="date" defaultValue={isoDate(job?.deadline)} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Start date
            <input name="startDate" type="date" defaultValue={isoDate(job?.startDate)} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            End date
            <input name="endDate" type="date" defaultValue={isoDate(job?.endDate)} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={durationSpecified} onChange={(event) => setDurationSpecified(event.target.checked)} />
            Duration specified
          </label>
          {durationSpecified ? (
            <label className="text-sm md:col-span-2">
              Duration
              <input name="duration" defaultValue={job?.duration ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
            </label>
          ) : (
            <p className="text-sm text-muted">Duration: Not specified</p>
          )}
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="font-semibold">Links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Official source URL
            <input name="sourceUrl" type="url" defaultValue={job?.sourceUrl ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Official application URL
            <input name="applicationUrl" type="url" defaultValue={job?.applicationUrl ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            Source name
            <input name="source" defaultValue={job?.source ?? "manual"} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="font-semibold">Other</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Required skills
            <input name="skills" defaultValue={job?.skills.join(", ") ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Education level
            <input name="education" defaultValue={job?.education ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Experience level
            <select name="seniority" defaultValue={job?.seniority ?? "unspecified"} className="field mt-1 w-full rounded-xl px-3 py-2">
              <option value="unspecified">Not specified</option>
              <option value="intern">Intern</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            Experience (details)
            <textarea
              name="experience"
              rows={3}
              defaultValue={job?.experience ?? ""}
              placeholder="Leave empty if not specified"
              className="field mt-1 w-full rounded-xl px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Salary min
            <input name="salaryMin" type="number" defaultValue={job?.salaryMin ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Salary max
            <input name="salaryMax" type="number" defaultValue={job?.salaryMax ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Currency
            <input name="currency" defaultValue={job?.currency ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            Language
            <input name="language" defaultValue={job?.language ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            Benefits
            <textarea name="benefits" rows={3} defaultValue={job?.benefits ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            Requirements
            <textarea name="requirements" rows={3} defaultValue={job?.requirements ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            Contact information
            <input name="contactInfo" defaultValue={job?.contactInfo ?? ""} className="field mt-1 w-full rounded-xl px-3 py-2" />
          </label>
        </div>
      </section>

      <label className="text-sm">
        Status
        <select name="status" defaultValue={job?.status ?? "published"} className="field mt-1 w-full max-w-xs rounded-xl px-3 py-2">
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="unpublished">Unpublished</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publishNow" defaultChecked={job?.status !== "unpublished" && job?.status !== "archived"} />
        Publish now (appears immediately on Offres)
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {pending ? "Saving…" : job ? "Save opportunity" : "Add opportunity"}
        </button>
        {status ? <p className="text-sm text-danger">{status}</p> : null}
      </div>
    </form>
  );
}
