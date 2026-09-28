"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Edit2,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { listTeamMembers, setMemberRole, type TeamMember } from "@/lib/api/customization";
import { getMyBalances, type LeaveBalance } from "@/lib/api/leave";
import { toast } from "sonner";

interface EmployeeProfile {
  department: string;
  jobTitle: string;
  phone: string;
  managerName: string;
  startDate: string;
  notes: string;
}

const PROFILE_KEY = (companyId: string, memberId: string) =>
  `zerpa_emp_profile_${companyId}_${memberId}`;

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

const ROLES = ["ADMIN", "STAFF"] as const;

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<EmployeeProfile>({
    department: "",
    jobTitle: "",
    phone: "",
    managerName: "",
    startDate: "",
    notes: "",
  });

  function loadStoredProfile(companyId: string, memberId: string) {
    try {
      const stored = localStorage.getItem(PROFILE_KEY(companyId, memberId));
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  }

  function saveProfile(companyId: string, memberId: string, p: EmployeeProfile) {
    try {
      localStorage.setItem(PROFILE_KEY(companyId, memberId), JSON.stringify(p));
    } catch {}
  }

  useEffect(() => {
    if (!company?.id) return;
    listTeamMembers(company.id)
      .then((all) => {
        setMembers(all);
        const found = all.find((m) => m.id === id);
        setMember(found ?? null);
        if (found) loadStoredProfile(company.id, found.id);
      })
      .catch(() => setMember(null))
      .finally(() => setLoadingMember(false));

    getMyBalances().then((r) => setLeaveBalances(r.balances)).catch(() => {});
  }, [company?.id, id]);

  async function handleSave() {
    if (!company?.id || !member) return;
    setSaving(true);
    setTimeout(() => {
      saveProfile(company.id, member.id, profile);
      toast.success("Profile saved");
      setEditing(false);
      setSaving(false);
    }, 300);
  }

  async function handleRoleChange(newRole: string) {
    if (!company?.id || !member) return;
    try {
      const updated = await setMemberRole(company.id, member.id, newRole);
      setMember(updated);
      toast.success(`Role changed to ${newRole}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  }

  const otherMembers = members.filter((m) => m.id !== id);

  if (loadingMember) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-fg py-8">Loading…</p>
      </PageContainer>
    );
  }

  if (!member) {
    return (
      <PageContainer>
        <p className="text-sm text-danger py-8">Team member not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/hr")}>
          <ArrowLeft size={14} className="mr-1" /> Back to HR
        </Button>
      </PageContainer>
    );
  }

  const initials = member.user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <PageContainer>
      <PageHeader
        title={member.user.fullName}
        subtitle={[profile.jobTitle, profile.department].filter(Boolean).join(" · ") || "Team member"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/hr")}>
              <ArrowLeft size={14} className="mr-1" />
              Back
            </Button>
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save size={14} className="mr-1" />
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X size={14} />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Edit2 size={14} className="mr-1" />
                Edit profile
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column — identity */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-[12px] border border-border bg-surface p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-fg flex items-center justify-center font-bold text-xl mx-auto mb-3">
              {initials}
            </div>
            <h3 className="font-semibold">{member.user.fullName}</h3>
            {profile.jobTitle && <p className="text-sm text-muted-fg">{profile.jobTitle}</p>}
            {profile.department && <p className="text-xs text-muted-fg mt-0.5">{profile.department}</p>}

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-left">
              <a
                href={`mailto:${member.user.email}`}
                className="flex items-center gap-2 text-xs text-muted-fg hover:text-primary"
              >
                <Mail size={12} />
                {member.user.email}
              </a>
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-2 text-xs text-muted-fg hover:text-primary"
                >
                  <Phone size={12} />
                  {profile.phone}
                </a>
              )}
              {member.joinedAt && (
                <p className="flex items-center gap-2 text-xs text-muted-fg">
                  <Calendar size={12} />
                  Joined {new Date(member.joinedAt).toLocaleDateString("en-ZA")}
                </p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="rounded-[12px] border border-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-primary" />
              <p className="text-sm font-semibold">System role</p>
            </div>
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Leave summary */}
          {leaveBalances.length > 0 && (
            <div className="rounded-[12px] border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-primary" />
                <p className="text-sm font-semibold">Leave balances</p>
              </div>
              <div className="space-y-2">
                {leaveBalances.slice(0, 4).map((b) => (
                  <div key={b.type.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-fg">{b.type.name}</span>
                    <span className="font-medium">
                      {b.remaining !== null ? `${b.remaining} days` : `${b.taken} taken`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — profile fields */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-[12px] border border-border bg-surface p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Briefcase size={14} className="text-primary" />
              Work details
            </h3>

            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Job title</Label>
                  <Input
                    className="mt-1 h-9 text-sm"
                    value={profile.jobTitle}
                    onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                    placeholder="e.g. Senior Engineer"
                  />
                </div>
                <div>
                  <Label className="text-xs">Department</Label>
                  <select
                    className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                    value={profile.department}
                    onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                  >
                    <option value="">No department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    className="mt-1 h-9 text-sm"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+27 82 000 0000"
                  />
                </div>
                <div>
                  <Label className="text-xs">Reports to</Label>
                  <select
                    className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                    value={profile.managerName}
                    onChange={(e) => setProfile((p) => ({ ...p, managerName: e.target.value }))}
                  >
                    <option value="">No manager</option>
                    {otherMembers.map((m) => (
                      <option key={m.id} value={m.user.fullName}>{m.user.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Start date</Label>
                  <Input
                    type="date"
                    className="mt-1 h-9 text-sm"
                    value={profile.startDate}
                    onChange={(e) => setProfile((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Job title", value: profile.jobTitle, icon: Briefcase },
                  { label: "Department", value: profile.department, icon: Users },
                  { label: "Phone", value: profile.phone, icon: Phone },
                  { label: "Reports to", value: profile.managerName, icon: User },
                  {
                    label: "Start date",
                    value: profile.startDate
                      ? new Date(profile.startDate).toLocaleDateString("en-ZA")
                      : "",
                    icon: Calendar,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-fg flex items-center gap-1 mb-1">
                      <Icon size={11} />
                      {label}
                    </dt>
                    <dd className={value ? "font-medium" : "text-muted-fg italic text-xs"}>
                      {value || "Not set"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-[12px] border border-border bg-surface p-5">
            <h3 className="section-title mb-3">Notes</h3>
            {editing ? (
              <textarea
                className="w-full min-h-[100px] rounded-[8px] border border-border bg-background px-3 py-2 text-sm resize-none"
                value={profile.notes}
                onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Internal notes visible only to admins…"
              />
            ) : (
              <p className={profile.notes ? "text-sm whitespace-pre-wrap" : "text-sm text-muted-fg italic"}>
                {profile.notes || "No notes"}
              </p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
