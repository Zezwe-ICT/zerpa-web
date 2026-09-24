"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/context";
import {
  listRoles,
  listTeamMembers,
  resetRole,
  saveRole,
  setMemberRole,
  type RoleInfo,
  type TeamMember,
} from "@/lib/api/customization";

const SELECT_CLASS = "rounded-[6px] border border-border bg-background px-2 py-1 text-sm";

export default function RolesSettingsPage() {
  const { company } = useAuth();
  const [permissions, setPermissions] = useState<Array<{ key: string; label: string }>>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [mine, setMine] = useState<string[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newRole, setNewRole] = useState("");

  const has = (perm: string) => mine.includes("*") || mine.includes(perm);

  const reload = useCallback(async () => {
    const data = await listRoles();
    setPermissions(data.permissions);
    setRoles(data.roles);
    setMine(data.mine);
    if (company?.id) setMembers(await listTeamMembers(company.id));
  }, [company?.id]);

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load roles"));
  }, [reload]);

  const canEditRoles = has("roles.manage");
  const canManageTeam = has("team.manage");

  const toggle = async (role: RoleInfo, perm: string) => {
    const current = role.permissions.includes("*") ? permissions.map((p) => p.key) : role.permissions;
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    try {
      await saveRole(role.key, { label: role.label, permissions: next });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="Roles & permissions"
        subtitle="Decide what each role can see and do. Owner access and customer portal access are fixed."
      />

      <section className="rounded-[12px] border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Permission</th>
              {roles.map((r) => (
                <th key={r.key} className="px-3 py-3 text-center whitespace-nowrap">
                  {r.label}
                  {r.customised && <span className="block text-[10px] normal-case text-primary">customised</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p.key} className="border-t border-border">
                <td className="px-4 py-2">
                  {p.label}
                  <span className="block font-mono text-[10px] text-muted-fg">{p.key}</span>
                </td>
                {roles.map((r) => {
                  const granted = r.permissions.includes("*") || r.permissions.includes(p.key);
                  return (
                    <td key={r.key} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={granted}
                        disabled={!canEditRoles || !r.editable || (!granted && !has(p.key))}
                        onChange={() => toggle(r, p.key)}
                        aria-label={`${r.label}: ${p.label}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {canEditRoles && (
              <tr className="border-t border-border">
                <td />
                {roles.map((r) => (
                  <td key={r.key} className="px-3 py-2 text-center">
                    {r.editable && (r.customised || !r.builtIn) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await resetRole(r.key);
                            await reload();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Reset failed");
                          }
                        }}
                      >
                        {r.builtIn ? "Reset" : "Delete"}
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {canEditRoles && (
        <section className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-xs"
            placeholder="New role, e.g. Mortuary attendant"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!newRole.trim()}
            onClick={async () => {
              const label = newRole.trim();
              const key = label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);
              if (!key) return;
              try {
                await saveRole(key, { label, permissions: ["records.view"] });
                setNewRole("");
                await reload();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not create role");
              }
            }}
          >
            Add role
          </Button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="section-title">Team</h2>
        <div className="rounded-[12px] border border-border divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{m.user.fullName || m.user.email}</p>
                <p className="text-xs text-muted-fg truncate">{m.user.email}</p>
              </div>
              {m.role === "PORTAL_USER" || !canManageTeam ? (
                <span className="text-xs text-muted-fg">{roles.find((r) => r.key === m.role)?.label ?? m.role}</span>
              ) : (
                <select
                  className={SELECT_CLASS}
                  value={m.role}
                  onChange={async (e) => {
                    if (!company?.id) return;
                    try {
                      await setMemberRole(company.id, m.id, e.target.value);
                      toast.success("Role updated");
                      await reload();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not change role");
                    }
                  }}
                >
                  {roles
                    .filter((r) => r.key !== "PORTAL_USER")
                    .map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                </select>
              )}
            </div>
          ))}
          {!members.length && <p className="px-4 py-6 text-center text-sm text-muted-fg">No team members loaded.</p>}
        </div>
      </section>
    </PageContainer>
  );
}
