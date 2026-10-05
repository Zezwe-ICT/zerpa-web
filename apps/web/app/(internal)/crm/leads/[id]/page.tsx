"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/dates";
import {
  ArrowLeft,
  Phone,
  Mail,
  PhoneCall,
  CalendarDays,
  FileText,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Plus,
  X,
  Clock,
  User,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { getLeadById, saveLeadNote, updateLeadStatus, updateLeadWork } from "@/lib/data/crm";
import { DEFAULT_LEAD_STAGES, getLeadStages } from "@/lib/data/lead-stages";
import type { PipelineStage } from "@/lib/api/customization";
import { useAuth } from "@/lib/auth/context";
import type { Lead, LeadActivity, LeadStatus, LeadActivityType } from "@zerpa/shared-types";
import { emailHeaders } from "@/lib/api/email";

// ── Activity helpers ───────────────────────────────────────

const ACTIVITY_ICONS: Record<LeadActivityType, React.ElementType> = {
  CALL: PhoneCall,
  EMAIL: Mail,
  MEETING: CalendarDays,
  NOTE: FileText,
  STAGE_CHANGE: TrendingUp,
};

const ACTIVITY_TYPE_LABELS: Record<LeadActivityType, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
  STAGE_CHANGE: "Stage Change",
};

const ACTIVITY_ICON_COLORS: Record<LeadActivityType, string> = {
  CALL: "bg-blue-100 text-blue-600",
  EMAIL: "bg-violet-100 text-violet-600",
  MEETING: "bg-amber-100 text-amber-600",
  NOTE: "bg-muted text-muted-fg",
  STAGE_CHANGE: "bg-success-bg text-success",
};

// ── Main component ─────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { company, user } = useAuth();
  const [lead, setLead] = useState<Lead | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Local mutable state for activities and stage
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>("NEW");
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_LEAD_STAGES);
  const [changingStage, setChangingStage] = useState(false);

  const openStages = stages.filter((s) => s.kind === "open");
  const wonStage = stages.find((s) => s.kind === "won");
  const lostStage = stages.find((s) => s.kind === "lost");

  function getNextStage(current: string): LeadStatus | null {
    const idx = openStages.findIndex((s) => s.key === current);
    if (idx === -1 || idx >= openStages.length - 1) return null;
    return openStages[idx + 1].key as LeadStatus;
  }

  function getStageLabel(key: string): string {
    return stages.find((s) => s.key === key)?.label ?? key;
  }

  /** Saves the stage first so the screen never shows a stage the API rejected. */
  async function changeStage(to: string): Promise<boolean> {
    setChangingStage(true);
    try {
      const updated = await updateLeadStatus(id, to, company?.id);
      setLead(updated);
      setCurrentStatus(updated.status);
      setActivities(updated.activities ?? []);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change stage");
      return false;
    } finally {
      setChangingStage(false);
    }
  }

  async function reloadLead() {
    const data = await getLeadById(id, company?.id);
    if (!data) return;
    setLead(data);
    setCurrentStatus(data.status);
    setActivities(data.activities ?? []);
  }

  // Log activity form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState<LeadActivityType>("CALL");
  const [logForm, setLogForm] = useState({
    summary: "",
    notes: "",
    nextSteps: "",
    durationMinutes: "",
    advanceStage: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Email composer state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLeadById(id, company?.id)
      .then((data) => {
        if (!data) {
          setIsNotFound(true);
        } else {
          setLead(data);
          setCurrentStatus(data.status);
          setActivities(data.activities ?? []);
        }
      })
      .catch(() => setIsNotFound(true))
      .finally(() => setLoading(false));
  }, [id, company?.id]);

  useEffect(() => {
    getLeadStages()
      .then(setStages)
      .catch(() => setStages(DEFAULT_LEAD_STAGES));
  }, [company?.id]);

  function handleAdvanceStage() {
    const next = getNextStage(currentStatus);
    if (next) void changeStage(next);
  }

  function handleMarkWon() {
    if (wonStage) void changeStage(wonStage.key);
  }

  function handleMarkLost() {
    if (lostStage) void changeStage(lostStage.key);
  }

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!logForm.summary.trim()) return;

    setSubmitting(true);
    try {
      await saveLeadNote(id, {
        kind: logType,
        summary: logForm.summary,
        notes: logForm.notes,
        nextStep: logForm.nextSteps,
      });
      const next = logForm.advanceStage ? getNextStage(currentStatus) : null;
      if (next) {
        const moved = await changeStage(next);
        if (!moved) return;
      } else {
        await reloadLead();
      }
      setLogForm({ summary: "", notes: "", nextSteps: "", durationMinutes: "", advanceStage: false });
      setShowLogForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that note");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const to = lead?.contact?.email;
    const subject = emailForm.subject.trim();
    const message = emailForm.message.trim();
    if (!to || !subject || !message) return;

    setSendingEmail(true);
    try {
      await saveLeadNote(id, {
        kind: "email",
        summary: `Emailed ${to}: ${subject}`,
        notes: message,
      });
      const res = await fetch("/api/email/lead", {
        method: "POST",
        headers: emailHeaders(),
        body: JSON.stringify({
          to,
          subject,
          message,
          senderName: user?.fullName,
          replyTo: user?.email,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      await reloadLead();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send email");
      }
      setEmailForm({ subject: "", message: "" });
      setShowEmailForm(false);
      toast.success("Email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  }

  // ── Render guards ────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Loading lead...</p>
        </div>
      </PageContainer>
    );
  }

  if (isNotFound || !lead) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Link href="/crm/leads">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={14} />
              Back to Leads
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Lead not found.</p>
        </div>
      </PageContainer>
    );
  }

  const nextStage = getNextStage(currentStatus);
  const currentKind = stages.find((s) => s.key === currentStatus)?.kind;
  const isWon = currentKind === "won" || currentStatus === "CLOSED_WON";
  const isLost = currentKind === "lost" || currentStatus === "CLOSED_LOST";
  const isClosed = currentKind ? currentKind !== "open" : isWon || isLost;
  const isLastActiveStage = openStages[openStages.length - 1]?.key === currentStatus;

  // Sort activities newest first for display
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <PageContainer>
      {/* Back */}
      <div className="mb-4">
        <Link href="/crm/leads">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={14} />
            Back to Leads
          </Button>
        </Link>
      </div>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {lead.title || lead.company}
        </h1>
        {lead.title && (
          <p className="text-sm text-muted-fg mt-0.5">{lead.company}</p>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-fg space-y-1">
            <span className="block">Next step</span>
            <input
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              defaultValue={lead.nextStep || ""}
              key={lead.nextStep || "next-step"}
              onBlur={async (e) => {
                try {
                  const updated = await updateLeadWork(id, { nextStep: e.target.value });
                  setLead(updated);
                  setActivities(updated.activities ?? []);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not save the next step");
                }
              }}
            />
          </label>
          {user?.id && lead.assignedAgentId !== user.id && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const updated = await updateLeadWork(id, { ownerId: user.id });
                  setLead(updated);
                  toast.success("Assigned to you");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not assign this lead");
                }
              }}
            >
              Assign to me
            </Button>
          )}
          {lead.quoteId && (
            <Link href={`/billing/quotes/${lead.quoteId}`} className="text-sm text-primary hover:underline">
              Open the draft quote
            </Link>
          )}
        </div>
      </div>

      {/* ── Pipeline Stepper ────────────────────────────────── */}
      <div className="rounded-[12px] border border-border bg-background p-4 mb-6">
        <div className="flex items-center gap-0 overflow-x-auto">
          {openStages.map((stage, idx) => {
            const stageIdx = openStages.findIndex(
              (s) => s.key === currentStatus
            );
            const isActive = stage.key === currentStatus;
            const isPast = idx < stageIdx;
            const isFuture = idx > stageIdx;

            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0">
                <div
                  className={`flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-[8px] transition ${
                    isActive
                      ? "bg-primary/10"
                      : isPast
                      ? ""
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isPast ? (
                      <CheckCircle2
                        size={14}
                        className="text-success flex-shrink-0"
                        strokeWidth={2}
                      />
                    ) : (
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isActive
                            ? "bg-primary"
                            : "bg-border"
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        isActive
                          ? "text-primary"
                          : isPast
                          ? "text-success"
                          : "text-muted-fg"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                </div>
                {idx < openStages.length - 1 && (
                  <ChevronRight
                    size={14}
                    className={`flex-shrink-0 ${
                      idx < stageIdx ? "text-success" : "text-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
          {/* Closed indicator */}
          <div className="flex items-center flex-shrink-0">
            <ChevronRight
              size={14}
              className={`flex-shrink-0 ${isClosed ? "text-success" : "text-border"}`}
            />
            <div
              className={`flex flex-col items-center px-2 py-1 rounded-[8px] ${
                isWon
                  ? "bg-success-bg"
                  : isLost
                  ? "bg-danger-bg"
                  : ""
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isWon
                      ? "bg-success"
                      : isLost
                      ? "bg-danger"
                      : "bg-border"
                  }`}
                />
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isWon
                      ? "text-success"
                      : isLost
                      ? "text-danger"
                      : "text-muted-fg"
                  }`}
                >
                  {isLost ? lostStage?.label ?? "Lost" : wonStage?.label ?? "Won"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {/* ── Left column (2/3) ─────────────────────────────── */}
        <div className="col-span-2 space-y-6">
          {/* Company & Contact */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 size={18} className="text-muted-fg" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">{lead.company}</h2>
                  <p className="text-xs text-muted-fg mt-0.5">{lead.vertical}</p>
                </div>
              </div>
              <Link href={`/crm/leads/${lead.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>

            {lead.contact && (
              <div className="border-t border-border pt-4 mt-2 space-y-2">
                <p className="text-xs text-muted-fg uppercase font-semibold tracking-wide">
                  Primary Contact
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-muted-fg" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {lead.contact.firstName} {lead.contact.lastName}
                    </p>
                    {lead.contact.jobTitle && (
                      <p className="text-xs text-muted-fg">{lead.contact.jobTitle}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {lead.contact.email && (
                        <a
                          href={`mailto:${lead.contact.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Mail size={12} />
                          {lead.contact.email}
                        </a>
                      )}
                      {lead.contact.phone && (
                        <a
                          href={`tel:${lead.contact.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Phone size={12} />
                          {lead.contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lead.notes && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-fg uppercase font-semibold tracking-wide mb-2">
                  Lead Notes
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          {/* ── Email composer ───────────────────────────────── */}
          {showEmailForm && (
            <div className="rounded-[12px] border border-border bg-background p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                    <Mail size={14} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Send Email</h3>
                    <p className="text-xs text-muted-fg">
                      To {lead.contact?.email ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-muted-fg hover:text-foreground transition"
                >
                  <X size={16} />
                </button>
              </div>

              {!lead.contact?.email ? (
                <p className="text-sm text-muted-fg">
                  This lead has no contact email address on file.
                </p>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-fg">
                      Subject *
                    </label>
                    <input
                      className="w-full h-9 rounded-[6px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={`Introduction from ${company?.name ?? "our team"}`}
                      value={emailForm.subject}
                      onChange={(e) =>
                        setEmailForm((p) => ({ ...p, subject: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-fg">
                      Message *
                    </label>
                    <textarea
                      className="w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      rows={7}
                      placeholder={`Hi ${lead.contact?.firstName ?? "there"},\n\n`}
                      value={emailForm.message}
                      onChange={(e) =>
                        setEmailForm((p) => ({ ...p, message: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-fg">
                    Sent via Zerpa. Replies go to{" "}
                    {user?.email ?? "your account email"}.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      className="gap-1.5"
                      disabled={
                        sendingEmail ||
                        !emailForm.subject.trim() ||
                        !emailForm.message.trim()
                      }
                    >
                      <Send size={14} />
                      {sendingEmail ? "Sending..." : "Send Email"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmailForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Log Activity section ─────────────────────────── */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Activity Log</h3>
              {!showLogForm && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowLogForm(true)}
                >
                  <Plus size={14} />
                  Log Activity
                </Button>
              )}
            </div>

            {/* Log form */}
            {showLogForm && (
              <form
                onSubmit={handleLogSubmit}
                className="mb-6 rounded-[10px] border border-border p-4 space-y-4 bg-muted/20"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">New Activity</p>
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="text-muted-fg hover:text-foreground transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Type toggle */}
                <div className="flex gap-1.5 flex-wrap">
                  {(
                    [
                      "CALL",
                      "EMAIL",
                      "MEETING",
                      "NOTE",
                    ] as LeadActivityType[]
                  ).map((t) => {
                    const Icon = ACTIVITY_ICONS[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLogType(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium border transition ${
                          logType === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-fg hover:text-foreground hover:border-foreground/20"
                        }`}
                      >
                        <Icon size={12} />
                        {ACTIVITY_TYPE_LABELS[t]}
                      </button>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-fg">
                    Summary / Outcome *
                  </label>
                  <input
                    className="w-full h-9 rounded-[6px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={
                      logType === "CALL"
                        ? "e.g. Discovery call – confirmed budget"
                        : logType === "EMAIL"
                        ? "e.g. Sent proposal document"
                        : logType === "MEETING"
                        ? "e.g. Demo – showed compliance module"
                        : "e.g. Internal note about next steps"
                    }
                    value={logForm.summary}
                    onChange={(e) =>
                      setLogForm((p) => ({ ...p, summary: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Duration (calls only) */}
                {logType === "CALL" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-fg">
                      Call Duration (minutes)
                    </label>
                    <input
                      className="w-28 h-9 rounded-[6px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      type="number"
                      min="1"
                      placeholder="15"
                      value={logForm.durationMinutes}
                      onChange={(e) =>
                        setLogForm((p) => ({
                          ...p,
                          durationMinutes: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                {/* Detailed notes */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-fg">
                    Detailed Notes
                  </label>
                  <textarea
                    className="w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={4}
                    placeholder="What was discussed? Key points, objections, decisions..."
                    value={logForm.notes}
                    onChange={(e) =>
                      setLogForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>

                {/* Next steps */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-fg">
                    Next Steps
                  </label>
                  <input
                    className="w-full h-9 rounded-[6px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. Send revised proposal by Friday"
                    value={logForm.nextSteps}
                    onChange={(e) =>
                      setLogForm((p) => ({ ...p, nextSteps: e.target.value }))
                    }
                  />
                </div>

                {/* Advance stage option */}
                {!isClosed && nextStage && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-primary"
                      checked={logForm.advanceStage}
                      onChange={(e) =>
                        setLogForm((p) => ({
                          ...p,
                          advanceStage: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm text-foreground">
                      Advance to{" "}
                      <strong>{getStageLabel(nextStage)}</strong> after logging
                    </span>
                  </label>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Activity"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Activity Timeline */}
            <div className="space-y-0">
              {/* Static: Lead Created */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Plus size={14} className="text-muted-fg" />
                  </div>
                  {sortedActivities.length > 0 && (
                    <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />
                  )}
                </div>
                <div className="pb-5 pt-1 min-w-0">
                  <p className="text-sm font-medium">Lead Created</p>
                  <p className="text-xs text-muted-fg mt-0.5">
                    {formatDate(lead.createdAt, "d MMM yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>

              {/* Dynamic activities */}
              {sortedActivities.map((act, idx) => {
                const Icon = ACTIVITY_ICONS[act.type];
                const iconColor = ACTIVITY_ICON_COLORS[act.type];
                const isLast = idx === sortedActivities.length - 1;
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}
                      >
                        <Icon size={14} strokeWidth={1.5} />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className={`${isLast ? "" : "pb-5"} pt-1 min-w-0 flex-1`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
                              {ACTIVITY_TYPE_LABELS[act.type]}
                            </span>
                            {act.durationMinutes && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-fg">
                                <Clock size={10} />
                                {act.durationMinutes} min
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium mt-0.5">
                            {act.summary}
                          </p>
                          {act.type === "STAGE_CHANGE" &&
                            act.stageChangedFrom &&
                            act.stageChangedTo && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-fg">
                                  {getStageLabel(act.stageChangedFrom)}
                                </span>
                                <ChevronRight size={10} className="text-muted-fg" />
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  {getStageLabel(act.stageChangedTo)}
                                </span>
                              </div>
                            )}
                          {act.notes && (
                            <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap border-l-2 border-border pl-3">
                              {act.notes}
                            </p>
                          )}
                          {act.nextSteps && (
                            <div className="mt-2 flex items-start gap-1.5">
                              <span className="text-xs font-semibold text-muted-fg mt-0.5">
                                Next:
                              </span>
                              <span className="text-xs text-foreground">
                                {act.nextSteps}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-fg whitespace-nowrap">
                            {formatDate(act.date, "d MMM yyyy")}
                          </p>
                          {act.agentName && (
                            <p className="text-xs text-muted-fg mt-0.5">
                              {act.agentName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right sidebar (1/3) ───────────────────────────── */}
        <div className="space-y-4">
          {/* Status & Stage Actions */}
          <div className="rounded-[12px] border border-border bg-background p-5 space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-fg uppercase tracking-wide font-semibold">
                Current Stage
              </span>
              <div>
                <StatusBadge status={currentStatus} />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Advance stage actions */}
            {!isClosed && (
              <div className="space-y-2">
                {nextStage && (
                  <Button
                    className="w-full justify-start gap-2"
                    size="sm"
                    onClick={handleAdvanceStage}
                    disabled={changingStage}
                  >
                    <ChevronRight size={14} />
                    Move to {getStageLabel(nextStage)}
                  </Button>
                )}
                {isLastActiveStage && (
                  <>
                    <Button
                      className="w-full justify-start gap-2 bg-success hover:bg-success/90 text-white"
                      size="sm"
                      onClick={handleMarkWon}
                      disabled={changingStage}
                    >
                      <CheckCircle2 size={14} />
                      Mark as Won
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-danger text-danger hover:bg-danger-bg"
                      size="sm"
                      onClick={handleMarkLost}
                      disabled={changingStage}
                    >
                      <X size={14} />
                      Mark as Lost
                    </Button>
                  </>
                )}
                {!nextStage && !isLastActiveStage && (
                  <>
                    <Button
                      className="w-full justify-start gap-2 bg-success hover:bg-success/90 text-white"
                      size="sm"
                      onClick={handleMarkWon}
                      disabled={changingStage}
                    >
                      <CheckCircle2 size={14} />
                      Mark as Won
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-danger text-danger hover:bg-danger-bg"
                      size="sm"
                      onClick={handleMarkLost}
                      disabled={changingStage}
                    >
                      <X size={14} />
                      Mark as Lost
                    </Button>
                  </>
                )}
              </div>
            )}

            {isClosed && (
              <p className="text-xs text-muted-fg">
                This lead is closed. Reopen by editing the lead.
              </p>
            )}
          </div>

          {/* Deal Details */}
          <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
            <p className="text-xs text-muted-fg uppercase tracking-wide font-semibold">
              Deal Details
            </p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-fg">Estimated Value</dt>
                <dd className="font-mono font-semibold">
                  R{lead.estimatedValue.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Vertical</dt>
                <dd className="font-medium">{lead.vertical}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Activities</dt>
                <dd className="font-medium">{activities.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Created</dt>
                <dd className="text-xs">
                  {formatDate(lead.createdAt, "d MMM yyyy")}
                </dd>
              </div>
              {lead.lastActivityAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-fg">Last Activity</dt>
                  <dd className="text-xs">
                    {formatDate(lead.lastActivityAt, "d MMM yyyy")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick action buttons */}
          {!showEmailForm && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={!lead.contact?.email}
              onClick={() => {
                setShowEmailForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Send size={14} />
              {lead.contact?.email ? "Send Email" : "No contact email"}
            </Button>
          )}
          {!showLogForm && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setLogType("CALL");
                setShowLogForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <PhoneCall size={14} />
              Log a Call
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
