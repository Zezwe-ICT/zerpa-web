/**
 * @file components/modules/settings/security-settings.tsx
 * @description Security configuration component
 */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  generateApiKey,
  listApiKeys,
  revokeApiKey,
} from "@/lib/api/settings";
import type { TeamMember } from "@/lib/api/settings";

interface ApiKey {
  id: string;
  key?: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  masked: boolean;
}

export function SecuritySettings() {
  const { company, user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!company?.id) return;
      try {
        setLoading(true);
        const [members, keys] = await Promise.all([
          getTeamMembers(company.id),
          listApiKeys(company.id),
        ]);
        setTeamMembers(members);
        setApiKeys(keys.map(k => ({ ...k, masked: true })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [company?.id]);

  const handleGenerateKey = async () => {
    if (!newKeyName || !company?.id) return;
    try {
      setGeneratingKey(true);
      const newKey = await generateApiKey(company.id, newKeyName);
      setApiKeys([
        ...apiKeys,
        { ...newKey, masked: true },
      ]);
      setNewKeyName("");
      setShowNewKeyForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail || !company?.id) return;
    try {
      setAddingMember(true);
      const member = await addTeamMember(company.id, newMemberEmail);
      setTeamMembers([...teamMembers, member]);

      // Send the invitation email (best-effort — the member is already added,
      // so a mail failure must not roll back or block the UI).
      try {
        await fetch("/api/email/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: newMemberEmail,
            companyName: company.name,
            inviterName: user?.fullName,
            role: member.role,
          }),
        });
      } catch {
        // Ignore — invitation email is non-critical.
      }

      setNewMemberEmail("");
      setShowNewMemberForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!company?.id) return;
    try {
      await removeTeamMember(company.id, memberId);
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!company?.id) return;
    try {
      await revokeApiKey(company.id, keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setApiKeys(prev =>
      prev.map(key =>
        key.id === keyId ? { ...key, masked: !key.masked } : key
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-danger-bg text-danger text-sm p-3 rounded-[8px]">
          ✕ {error}
        </div>
      )}

      {/* Team Members */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
            <p className="text-sm text-muted-fg mt-0.5">
              Manage who has access to your workspace
            </p>
          </div>
          <Button
            onClick={() => setShowNewMemberForm(!showNewMemberForm)}
            size="sm"
          >
            Add Member
          </Button>
        </div>

        {showNewMemberForm && (
          <div className="mb-4 p-4 border border-border rounded-[12px] bg-surface">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-[6px] text-sm"
              />
              <Button onClick={handleAddMember} size="sm" disabled={addingMember}>
                {addingMember ? "Adding..." : "Add"}
              </Button>
              <Button
                onClick={() => setShowNewMemberForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-fg">Loading team members...</div>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-border rounded-[12px]"
              >
                <div>
                  <h4 className="font-medium text-foreground">{member.fullName}</h4>
                  <p className="text-xs text-muted-fg">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-surface px-2 py-1 rounded text-muted-fg">
                    {member.role}
                  </span>
                  {member.role !== "OWNER" && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-danger hover:text-danger/80 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">API Keys</h3>
            <p className="text-sm text-muted-fg mt-0.5">
              Create and manage API keys for integrations
            </p>
          </div>
          <Button
            onClick={() => setShowNewKeyForm(!showNewKeyForm)}
            size="sm"
          >
            Generate New Key
          </Button>
        </div>

        {showNewKeyForm && (
          <div className="mb-4 p-4 border border-border rounded-[12px] bg-surface">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Key name (e.g., Production, Testing)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-[6px] text-sm"
              />
              <Button onClick={handleGenerateKey} size="sm" disabled={generatingKey}>
                {generatingKey ? "Creating..." : "Create"}
              </Button>
              <Button
                onClick={() => setShowNewKeyForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-3 p-4 border border-border rounded-[12px]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{key.name}</h4>
                  <span className="text-xs bg-surface px-2 py-1 rounded text-muted-fg">
                    {key.createdAt}
                  </span>
                </div>
                {key.key && (
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-muted-fg font-mono bg-surface px-2 py-1 rounded flex-1 truncate">
                      {key.masked ? "••••••••••••••••" : key.key}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
                      className="text-muted-fg hover:text-foreground transition-colors"
                      title={key.masked ? "Show" : "Hide"}
                    >
                      {key.masked ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.key || "")}
                      className="text-muted-fg hover:text-foreground transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                )}
                {key.lastUsed && (
                  <p className="text-xs text-muted-fg mt-1">
                    Last used: {key.lastUsed}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleRevokeKey(key.id)}
                className="text-danger hover:text-danger/80 transition-colors text-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
