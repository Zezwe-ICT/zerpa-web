"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Edit2,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/lib/auth/context";
import { addTeamMember } from "@/lib/api/companies";
import { listTeamMembers, setMemberRole, type TeamMember } from "@/lib/api/customization";
import { ApiError } from "@/lib/api/client";
import { emailHeaders } from "@/lib/api/email";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OnboardingTask {
  id: string;
  label: string;
  category: "Access" | "Equipment" | "Training" | "Documents" | "Intro";
  done: boolean;
}

interface OnboardingRecord {
  id: string;
  employeeName: string;
  startDate: string;
  tasks: OnboardingTask[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLES = ["ADMIN", "STAFF"] as const;

const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Support",
  "Operations",
  "Finance",
  "HR",
  "Marketing",
  "Executive",
];

const DEFAULT_ONBOARDING_TASKS: Omit<OnboardingTask, "id" | "done">[] = [
  { label: "Send welcome email", category: "Intro" },
  { label: "Set up company email account", category: "Access" },
  { label: "Add to team Slack / WhatsApp group", category: "Access" },
  { label: "Create system login (Zerpa)", category: "Access" },
  { label: "Issue laptop or equipment", category: "Equipment" },
  { label: "Share employee handbook", category: "Documents" },
  { label: "Sign NDA / employment contract", category: "Documents" },
  { label: "Complete FICA / identity verification", category: "Documents" },
  { label: "Introduce to team", category: "Intro" },
  { label: "Schedule 30-day check-in", category: "Intro" },
];

const PROFILE_KEY = (companyId: string, memberId: string) =>
  `zerpa_emp_profile_${companyId}_${memberId}`;

const ONBOARDING_KEY = (companyId: string) => `zerpa_hr_onboarding_${companyId}`;

function getStoredProfile(companyId: string, memberId: string) {
  try {
    const s = localStorage.getItem(PROFILE_KEY(companyId, memberId));
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

type Tab = "team" | "onboarding" | "org";

// ─── Component ──────────────────────────────────────────────────────────────

export default function HRPage() {
  const { company, user } = useAuth();

  // Team state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Profiles (lightweight extended data stored locally)
  const [profiles, setProfiles] = useState<Record<string, { department?: string; jobTitle?: string }>>({});

  // Onboarding state
  const [onboardingRecords, setOnboardingRecords] = useState<OnboardingRecord[]>([]);
  const [showNewOnboarding, setShowNewOnboarding] = useState(false);
  const [newHireName, setNewHireName] = useState("");
  const [newHireStart, setNewHireStart] = useState(() => new Date().toISOString().slice(0, 10));

  // Form state for adding team member
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");

  // Tab
  const [tab, setTab] = useState<Tab>("team");

  // ── Load members ──────────────────────────────────────────────────────────

  async function reload() {
    if (!company) return;
    try {
      const list = await listTeamMembers(company.id);
      setMembers(list);
      // Load locally-stored extended profiles
      const p: Record<string, { department?: string; jobTitle?: string }> = {};
      list.forEach((m) => {
        const stored = getStoredProfile(company.id, m.id);
        if (stored) p[m.id] = stored;
      });
      setProfiles(p);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [company?.id]);

  // ── Load onboarding ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!company?.id) return;
    try {
      const s = localStorage.getItem(ONBOARDING_KEY(company.id));
      if (s) setOnboardingRecords(JSON.parse(s));
    } catch {}
  }, [company?.id]);

  function saveOnboarding(records: OnboardingRecord[]) {
    setOnboardingRecords(records);
    if (company?.id) {
      try { localStorage.setItem(ONBOARDING_KEY(company.id), JSON.stringify(records)); } catch {}
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function resetAddForm() {
    setEmail(""); setFullName(""); setPassword(""); setRole("STAFF");
    setShowAddForm(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company) return toast.error("No company found.");
    setSubmitting(true);
    try {
      const res = await addTeamMember(company.id, { email, fullName, password, role });
      toast.success(`${res.membership.user.fullName} added as ${res.membership.role}.`);
      try {
        const mailRes = await fetch("/api/email/invite", {
          method: "POST",
          headers: emailHeaders(),
          body: JSON.stringify({
            to: res.membership.user.email,
            companyName: company.name,
            inviterName: user?.fullName,
            role: res.membership.role,
            tempPassword: password,
          }),
        });
        if (!mailRes.ok) toast.warning("Member added, but invitation email couldn't be sent.");
      } catch {
        toast.warning("Member added, but invitation email couldn't be sent.");
      }
      resetAddForm();
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add team member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    if (!company) return;
    setChangingRole(memberId);
    try {
      await setMemberRole(company.id, memberId, newRole);
      toast.success(`Role updated to ${newRole}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setChangingRole(null);
    }
  }

  function handleCreateOnboarding() {
    if (!newHireName.trim()) return toast.error("Enter employee name");
    const record: OnboardingRecord = {
      id: `ob_${Date.now()}`,
      employeeName: newHireName.trim(),
      startDate: newHireStart,
      tasks: DEFAULT_ONBOARDING_TASKS.map((t, i) => ({
        ...t,
        id: `t_${Date.now()}_${i}`,
        done: false,
      })),
    };
    saveOnboarding([...onboardingRecords, record]);
    setNewHireName("");
    setNewHireStart(new Date().toISOString().slice(0, 10));
    setShowNewOnboarding(false);
    toast.success(`Onboarding checklist created for ${record.employeeName}`);
  }

  function handleToggleTask(recordId: string, taskId: string) {
    const records = onboardingRecords.map((r) =>
      r.id !== recordId
        ? r
        : { ...r, tasks: r.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
    );
    saveOnboarding(records);
  }

  function handleDeleteOnboarding(recordId: string) {
    saveOnboarding(onboardingRecords.filter((r) => r.id !== recordId));
    toast.success("Onboarding checklist removed");
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const adminCount = members.filter((m) => m.role === "ADMIN").length;
  const staffCount = members.filter((m) => m.role === "STAFF").length;

  const departments = useMemo(() => {
    const depts = new Set<string>();
    Object.values(profiles).forEach((p) => { if (p.department) depts.add(p.department); });
    return [...depts].sort();
  }, [profiles]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const p = profiles[m.id];
      if (deptFilter && p?.department !== deptFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          m.user.fullName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q) ||
          p?.jobTitle?.toLowerCase().includes(q) ||
          p?.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, profiles, deptFilter, searchTerm]);

  // Group by department for org-chart-style view
  const grouped = useMemo(() => {
    const map: Record<string, TeamMember[]> = {};
    members.forEach((m) => {
      const dept = profiles[m.id]?.department || "Unassigned";
      if (!map[dept]) map[dept] = [];
      map[dept].push(m);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [members, profiles]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <PageHeader
        title="Human Resources"
        subtitle={company ? `Team operations for ${company.name}` : "Set up your company to manage team members"}
        action={
          company && tab === "team" && !showAddForm ? (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <UserPlus size={14} className="mr-1.5" />
              Add member
            </Button>
          ) : tab === "onboarding" && !showNewOnboarding ? (
            <Button size="sm" onClick={() => setShowNewOnboarding(true)}>
              <Plus size={14} className="mr-1.5" />
              New onboarding
            </Button>
          ) : undefined
        }
      />

      {/* Disclaimer banner */}
      <div className="rounded-[10px] border border-border bg-surface px-4 py-3 mb-6 text-xs text-muted-fg flex items-start gap-2">
        <CircleDot size={13} className="text-primary mt-0.5 flex-shrink-0" />
        <span>
          Zerpa HR is your team ops layer — headcount, onboarding, and leave in one place. It complements
          (not replaces) dedicated HR systems like SimplePay, Sage HR, or BambooHR.
        </span>
      </div>

      {/* Stats */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Headcount" value={String(members.length)} icon={Users as LucideIcon} />
          <StatsCard label="Departments" value={String(departments.length || "—")} icon={Briefcase as LucideIcon} />
          <StatsCard label="Admins" value={String(adminCount)} icon={Shield as LucideIcon} />
          <StatsCard label="Staff" value={String(staffCount)} icon={UserCheck as LucideIcon} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["team", "onboarding", "org"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-fg hover:text-foreground"
            }`}
          >
            {t === "org" ? "Org chart" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── TEAM TAB ─────────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="space-y-4">
          {/* Add form */}
          {showAddForm && (
            <div className="rounded-[12px] border border-border bg-background p-6 mb-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Add team member</h2>
                <Button size="sm" variant="ghost" onClick={resetAddForm}><X size={14} /></Button>
              </div>
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" placeholder="Jane Smith" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="jane@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Temporary password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-fg">Required for new users. Leave blank if user already has an account.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
                    className="w-full h-9 rounded-[6px] border border-border bg-background px-3 text-sm"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={resetAddForm}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Adding…" : "Add member"}</Button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          {members.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
                <input
                  type="text"
                  placeholder="Search by name, email or title…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-sm bg-background h-9"
                />
              </div>
              {departments.length > 0 && (
                <select
                  className="border border-border rounded-[8px] px-3 py-1.5 text-sm bg-background h-9"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              {(searchTerm || deptFilter) && (
                <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setDeptFilter(""); }}>
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Team list */}
          {loading && <p className="text-sm text-muted-fg py-4">Loading team…</p>}

          {!loading && filteredMembers.length > 0 && (
            <div className="rounded-[12px] border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Title</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-right px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                    const p = profiles[m.id];
                    const initials = m.user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <tr key={m.id} className="border-t border-border hover:bg-surface/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium">{m.user.fullName}</p>
                              <a href={`mailto:${m.user.email}`} className="text-xs text-muted-fg hover:text-primary flex items-center gap-1">
                                <Mail size={10} />
                                {m.user.email}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-fg hidden md:table-cell">
                          {p?.department || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-fg hidden lg:table-cell">
                          {p?.jobTitle || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={m.role}
                            disabled={changingRole === m.id}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="h-8 rounded-[6px] border border-border bg-background px-2 text-xs disabled:opacity-50"
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/hr/${m.id}`}>
                            <Button size="sm" variant="outline">
                              <Edit2 size={13} className="mr-1" />
                              Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !company && (
            <div className="rounded-[12px] border border-border bg-background p-8 text-center text-muted-fg text-sm">
              Complete onboarding to manage team members.
            </div>
          )}

          {!loading && company && members.length === 0 && !showAddForm && (
            <div className="rounded-[12px] border border-dashed border-border p-10 text-center space-y-3">
              <User size={24} className="mx-auto text-muted-fg opacity-50" />
              <p className="font-medium">No team members yet</p>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <UserPlus size={14} className="mr-1.5" />
                Add first member
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── ONBOARDING TAB ───────────────────────────────────────────────── */}
      {tab === "onboarding" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-fg">
            Create a checklist for each new hire. Track their setup progress without leaving Zerpa.
          </p>

          {/* New onboarding form */}
          {showNewOnboarding && (
            <div className="rounded-[12px] border border-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">New hire onboarding</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowNewOnboarding(false)}><X size={14} /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Employee name</Label>
                  <Input
                    className="mt-1 h-9 text-sm"
                    value={newHireName}
                    onChange={(e) => setNewHireName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <Label className="text-xs">Start date</Label>
                  <Input
                    type="date"
                    className="mt-1 h-9 text-sm"
                    value={newHireStart}
                    onChange={(e) => setNewHireStart(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-fg">
                Creates a default {DEFAULT_ONBOARDING_TASKS.length}-step checklist. You can customise tasks after.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateOnboarding}>Create checklist</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewOnboarding(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {onboardingRecords.length === 0 && !showNewOnboarding && (
            <div className="rounded-[12px] border border-dashed border-border p-10 text-center space-y-3">
              <CheckSquare size={24} className="mx-auto text-muted-fg opacity-50" />
              <p className="font-medium">No onboarding checklists</p>
              <p className="text-sm text-muted-fg">Start one for your next new hire.</p>
              <Button size="sm" onClick={() => setShowNewOnboarding(true)}>
                <Plus size={14} className="mr-1" />
                New onboarding
              </Button>
            </div>
          )}

          {onboardingRecords.map((record) => {
            const done = record.tasks.filter((t) => t.done).length;
            const total = record.tasks.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const complete = done === total;

            return (
              <div
                key={record.id}
                className={`rounded-[12px] border bg-background overflow-hidden ${complete ? "border-success/40" : "border-border"}`}
              >
                <div className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{record.employeeName}</h3>
                    <p className="text-xs text-muted-fg mt-0.5">
                      Start: {new Date(record.startDate).toLocaleDateString("en-ZA")} · {done}/{total} tasks
                    </p>
                    <div className="mt-2 w-48 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${complete ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteOnboarding(record.id)}
                    className="text-muted-fg hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>

                <div className="border-t border-border divide-y divide-border">
                  {record.tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-surface/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleTask(record.id, task.id)}
                        className="rounded border-border"
                      />
                      <span className={`text-sm flex-1 ${task.done ? "line-through text-muted-fg" : ""}`}>
                        {task.label}
                      </span>
                      <span className="text-xs text-muted-fg bg-surface border border-border rounded-full px-2 py-0.5">
                        {task.category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ORG CHART TAB ────────────────────────────────────────────────── */}
      {tab === "org" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-fg">
            Team structure by department. Set each member's department on their{" "}
            <Link href="/hr" onClick={() => setTab("team")} className="text-primary hover:underline">
              profile page
            </Link>{" "}
            to populate the chart.
          </p>

          {loading && <p className="text-sm text-muted-fg py-4">Loading…</p>}

          {!loading && grouped.length === 0 && (
            <div className="rounded-[12px] border border-dashed border-border p-10 text-center space-y-3">
              <Users size={24} className="mx-auto text-muted-fg opacity-50" />
              <p className="font-medium">No team to chart yet</p>
              <Button size="sm" onClick={() => setTab("team")}>Go to team</Button>
            </div>
          )}

          {!loading && grouped.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grouped.map(([dept, deptMembers]) => (
                <div key={dept} className="rounded-[12px] border border-border bg-surface overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase size={13} className="text-primary" />
                      <span className="font-semibold text-sm">{dept}</span>
                    </div>
                    <span className="text-xs text-muted-fg">{deptMembers.length}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {deptMembers.map((m) => {
                      const p = profiles[m.id];
                      const initials = m.user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                      return (
                        <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{m.user.fullName}</p>
                            {p?.jobTitle && (
                              <p className="text-xs text-muted-fg truncate">{p.jobTitle}</p>
                            )}
                          </div>
                          <Link href={`/hr/${m.id}`}>
                            <ArrowRight size={13} className="text-muted-fg hover:text-primary" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
