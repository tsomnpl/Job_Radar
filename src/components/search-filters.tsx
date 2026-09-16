import type { SearchFilters } from "@/lib/types";

export function SearchFiltersForm({
  query,
  filters,
}: {
  query: string;
  filters: SearchFilters;
}) {
  return (
    <form method="get" action="/search" className="panel grid gap-3 p-4 md:grid-cols-4">
      <input type="hidden" name="q" value={query} />
      <label className="text-xs text-muted">
        Opportunity type
        <select name="type" defaultValue={filters.contractType ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm">
          <option value="">All</option>
          <option value="internship">Internship</option>
          <option value="employee">Job / Employee</option>
          <option value="consultant">Consultant</option>
          <option value="freelance">Freelance</option>
          <option value="mission">Mission</option>
          <option value="apprenticeship">Apprenticeship</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Location
        <input name="location" defaultValue={filters.location ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm" />
      </label>
      <label className="text-xs text-muted">
        Remote
        <select name="remote" defaultValue={filters.remoteType ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm">
          <option value="">All</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Country
        <input name="country" defaultValue={filters.country ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm" />
      </label>
      <label className="text-xs text-muted">
        Experience
        <select name="experience" defaultValue={filters.seniority ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm">
          <option value="">All</option>
          <option value="intern">Intern</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Skills
        <input name="skills" defaultValue={filters.skills ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm" />
      </label>
      <label className="text-xs text-muted">
        Deadline
        <select name="deadline" defaultValue={filters.deadline ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="closing_soon">Closing soon</option>
          <option value="expired">Expired</option>
          <option value="unspecified">Not specified</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Published date
        <select name="published" defaultValue={filters.published ?? ""} className="field mt-1 w-full rounded-lg px-2 py-2 text-sm">
          <option value="">Any</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </label>
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full rounded-xl px-3 py-2 text-sm font-semibold">
          Apply filters
        </button>
      </div>
    </form>
  );
}
