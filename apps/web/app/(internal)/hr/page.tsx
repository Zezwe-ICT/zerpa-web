"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Mail, Shield, UserCheck, UserPlus, Users } from "lucide-react";
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

const ROLES = ["ADMIN", "STAFF"] as const;

export default function HRPage() {
  const { company, user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");

  async function reload() {
    if (!company) return;
    try {
      setMembers(await listTeamMembers(company.id));
    } catch {
      // fallback to empty if endpoint not available
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [company?.id]);

  function resetForm() {
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("STAFF");
    setShowForm(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company) return toast.error("No company found. Please complete onboarding first.");
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
        if (!mailRes.ok) toast.warning("Member added, but the invitation email couldn't be sent.");
      } catch {
        toast.warning("Member added, but the invitation email couldn't be sent.");
      }
      resetForm();
      await reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to add team member";
      toast.error(message);
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
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setChangingRole(null);
    }
  }

  const adminCount = members.filter((m) => m.role === "ADMIN").length;
  const staffCount = members.filter((m) => m.role === "STAFF").length;

  return (
    <PageContainer>
      <PageHeader
        title="Human Resources"
        subtitle={company ? `Managing team for ${company.name}` : "Set up your company first to add team members"}
        action={
          company && !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <UserPlus size={14} className="mr-1.5" />
              Add Team Member
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      {members.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard title="Team size" value={String(members.length)} icon={Users} />
          <StatsCard title="Admins" value={String(adminCount)} icon={Shield} />
          <StatsCard title="Staff" value={String(staffCount)} icon={UserCheck} />
        </div>
      )}

      {/* Add Team Member Form */}
      {showForm && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6">
          <h2 className="section-title mb-4">Add Team Member</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Smith"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-fg">Required for new users. Leave blank if user already exists.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
                className="w-full h-9 rounded-[6px] border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Adding…" : "Add Member"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* No company warning */}
      {!company && (
        <div className="rounded-[12px] border border-border bg-background p-8 text-center text-muted-fg text-sm">
          Complete onboarding to manage team members.
        </div>
      )}

      {/* Loading */}
      {loading && company && (
        <p className="text-sm text-muted-fg py-4">Loading team members…</p>
      )}

      {/* Members list */}
      {!loading && members.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-[12px] border border-border bg-background p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-fg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {member.user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{member.user.fullName}</h3>
                  <a
                    href={`mailto:${member.user.email}`}
                    className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary mt-1"
                  >
                    <Mail size={12} />
                    {member.user.email}
                  </a>
                  {member.joinedAt && (
                    <p className="text-xs text-muted-fg mt-0.5">
                      Joined {new Date(member.joinedAt).toLocaleDateString("en-ZA")}
                    </p>
                  )}
                </div>
              </div>

              {/* Role selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={member.role}
                  disabled={changingRole === member.id}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="h-8 rounded-[6px] border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {changingRole === member.id && (
                  <span className="text-xs text-muted-fg">Saving…</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state when company exists but no members */}
      {!loading && company && members.length === 0 && !showForm && (
        <div className="rounded-[12px] border border-dashed border-border bg-background p-8 text-center space-y-3">
          <p className="text-sm text-muted-fg">No team members added yet.</p>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <UserPlus size={14} className="mr-1.5" />
            Add your first team member
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
