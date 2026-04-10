"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Briefcase, UserPlus } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { addTeamMember } from "@/lib/api/companies";
import { ApiError } from "@/lib/api/client";

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

const ROLES = ["ADMIN", "STAFF"] as const;

export default function HRPage() {
  const { company } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");

  function resetForm() {
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("STAFF");
    setShowForm(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company) {
      toast.error("No company found. Please complete onboarding first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await addTeamMember(company.id, {
        email,
        fullName,
        password,
        role,
      });
      setMembers((prev) => [
        ...prev,
        {
          id: res.membership.id,
          email: res.membership.user.email,
          fullName: res.membership.user.fullName,
          role: res.membership.role,
        },
      ]);
      toast.success(
        `${res.membership.user.fullName} added as ${res.membership.role}.`
      );
      resetForm();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to add team member";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Human Resources"
        subtitle={
          members.length > 0
            ? `${members.length} team member${members.length !== 1 ? "s" : ""} added`
            : company
            ? `Managing team for ${company.name}`
            : "Set up your company first to add team members"
        }
        action={
          company && !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <UserPlus size={14} className="mr-1.5" />
              Add Team Member
            </Button>
          ) : undefined
        }
      />

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

      {/* Members list */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-[12px] border border-border bg-background p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-fg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{member.fullName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-fg mt-1">
                    <Briefcase size={12} />
                    {member.role}
                  </div>
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary mt-1"
                  >
                    <Mail size={12} />
                    {member.email}
                  </a>
                </div>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-surface border border-border text-muted-fg">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state when company exists but no members added yet */}
      {company && members.length === 0 && !showForm && (
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
