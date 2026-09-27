/**
 * @file components/modules/projects/project-board.tsx
 * @description A project's task board (drag cards between stages), milestones, time, and
 * "Invoice unbilled time". The task panel edits a task and logs time; its stage picker is the
 * keyboard-friendly way to move a card.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, Clock, Flag, Plus, Receipt, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/context";
import { listTeamMembers, type TeamMember } from "@/lib/api/customization";
import {
  createMilestone,
  createTask,
  deleteTask,
  getProject,
  getTask,
  hours,
  invoiceProjectTime,
  listMyTasks,
  logTime,
  updateMilestone,
  updateProject,
  updateTask,
  type Priority,
  type ProjectDetail,
  type Task,
  type TaskStage,
} from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const PRIORITY_STYLE: Record<Priority, string> = {
  low: "text-muted-fg",
  normal: "text-foreground-2",
  high: "text-warning",
  urgent: "text-danger",
};
const STAGE_DOT: Record<TaskStage, string> = {
  todo: "bg-muted-fg",
  in_progress: "bg-info",
  review: "bg-warning",
  done: "bg-success",
};

function positionBetween(before?: Task, after?: Task) {
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 1;
}

export function ProjectBoard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { company } = useAuth();
  const { can } = usePermissions();
  const canEdit = can("records.edit");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ stage: TaskStage; index: number } | null>(null);
  const [newTitle, setNewTitle] = useState<Record<string, string>>({});
  const [milestoneFilter, setMilestoneFilter] = useState<string | null>(null);

  async function reload() {
    try {
      setProject(await getProject(projectId));
    } catch {
      toast.error("Project not found");
      router.push("/projects");
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  useEffect(() => {
    if (company?.id) listTeamMembers(company.id).then((m) => setMembers(m.filter((x) => x.role !== "PORTAL_USER"))).catch(() => undefined);
  }, [company?.id]);

  const columns = useMemo(() => {
    const byStage: Record<string, Task[]> = {};
    (project?.stages ?? []).forEach((s) => (byStage[s.key] = []));
    (project?.tasks ?? [])
      .filter((t) => !milestoneFilter || t.milestoneId === milestoneFilter)
      .forEach((t) => byStage[t.stage]?.push(t));
    Object.values(byStage).forEach((list) => list.sort((a, b) => a.position - b.position));
    return byStage;
  }, [project, milestoneFilter]);

  function patchLocal(task: Task) {
    setProject((p) => (p ? { ...p, tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)) } : p));
  }

  async function move(taskId: string, stage: TaskStage, index: number) {
    if (!project) return;
    const list = (columns[stage] ?? []).filter((t) => t.id !== taskId);
    const position = positionBetween(list[index - 1], list[index]);
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task || (task.stage === stage && task.position === position)) return;
    patchLocal({ ...task, stage, position });
    try {
      patchLocal(await updateTask(taskId, { stage, position }));
      if (stage === "done" && task.stage !== "done") reload(); // progress + milestone counts
    } catch (e) {
      toast.error(errorText(e, "Could not move the task"));
      reload();
    }
  }

  function onDragOver(e: React.DragEvent, stage: TaskStage) {
    if (!dragId) return;
    e.preventDefault();
    const cards = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[data-card]")).filter(
      (c) => c.dataset.card !== dragId,
    );
    let index = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) {
        index = i;
        break;
      }
    }
    if (dropAt?.stage !== stage || dropAt.index !== index) setDropAt({ stage, index });
  }

  async function quickAdd(stage: TaskStage) {
    const title = (newTitle[stage] ?? "").trim();
    if (title.length < 2 || !project) return;
    setNewTitle((n) => ({ ...n, [stage]: "" }));
    try {
      const t = await createTask({ projectId: project.id, title, stage, milestoneId: milestoneFilter });
      setProject((p) => (p ? { ...p, tasks: [...p.tasks, t], taskCount: p.taskCount + 1 } : p));
    } catch (e) {
      toast.error(errorText(e, "Could not add the task"));
    }
  }

  async function invoiceTime() {
    if (!project) return;
    try {
      const inv = await invoiceProjectTime(project.id);
      toast.success(`Draft invoice ${inv.invoiceNumber} created`);
      router.push(`/billing/invoices/${inv.id}`);
    } catch (e) {
      toast.error(errorText(e, "Could not invoice the time"));
    }
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="h-64 animate-pulse rounded-[12px] bg-surface" />
      </PageContainer>
    );
  }

  const budgetUse = project.budgetHours ? (project.loggedMinutes / 60 / project.budgetHours) * 100 : null;

  return (
    <PageContainer>
      <Link href="/projects" className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4 w-fit">
        <ArrowLeft size={14} /> Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="page-title truncate">{project.name}</h1>
          <p className="text-sm text-muted-fg mt-1">
            {project.accountName ?? "Internal project"}
            {project.dueDate ? ` · Due ${formatDate(project.dueDate)}` : ""}
            {project.billingType === "hourly" && project.hourlyRate ? ` · ${formatCurrency(project.hourlyRate)}/h` : ""}
            {project.billingType === "fixed" ? ` · Fixed ${formatCurrency(project.fixedPrice)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <select
              value={project.status}
              onChange={async (e) => {
                try {
                  await updateProject(project.id, { status: e.target.value as ProjectDetail["status"] });
                  setProject({ ...project, status: e.target.value as ProjectDetail["status"] });
                } catch (err) {
                  toast.error(errorText(err, "Could not update the project"));
                }
              }}
              className="h-9 rounded-[8px] border border-input bg-background px-2 text-sm"
              aria-label="Project status"
            >
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
          {can("billing.manage") && project.billingType === "hourly" && project.unbilledMinutes > 0 && (
            <Button size="sm" onClick={invoiceTime}>
              <Receipt size={14} className="mr-1.5" /> Invoice {hours(project.unbilledMinutes)} unbilled
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <div className="rounded-[12px] border border-border bg-background p-4">
          <p className="text-xs text-muted-fg">Progress</p>
          <p className="text-lg font-semibold">{project.progress}% <span className="text-sm font-normal text-muted-fg">· {project.doneCount}/{project.taskCount} tasks</span></p>
          <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden"><motion.div className="h-full bg-primary" animate={{ width: `${project.progress}%` }} /></div>
        </div>
        <div className="rounded-[12px] border border-border bg-background p-4">
          <p className="text-xs text-muted-fg">Time logged</p>
          <p className={cn("text-lg font-semibold", budgetUse !== null && budgetUse > 100 && "text-danger")}>
            {hours(project.loggedMinutes)}
            {project.budgetHours ? <span className="text-sm font-normal text-muted-fg"> of {project.budgetHours}h budget</span> : null}
          </p>
          {budgetUse !== null && (
            <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <motion.div className={cn("h-full", budgetUse > 100 ? "bg-danger" : budgetUse > 80 ? "bg-warning" : "bg-success")} animate={{ width: `${Math.min(budgetUse, 100)}%` }} />
            </div>
          )}
        </div>
        <Milestones project={project} canEdit={canEdit} filter={milestoneFilter} setFilter={setMilestoneFilter} onChange={reload} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1" role="list" aria-label="Task board">
        {project.stages.map((stage) => {
          const tasks = columns[stage.key] ?? [];
          return (
            <section
              key={stage.key}
              className={cn("flex-none w-72 rounded-[12px] bg-surface p-2.5 transition-colors", dragId && dropAt?.stage === stage.key && "bg-primary-tint")}
              onDragOver={(e) => onDragOver(e, stage.key)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dropAt) move(dragId, stage.key, dropAt.index);
                setDragId(null);
                setDropAt(null);
              }}
              aria-label={stage.label}
            >
              <header className="flex items-center justify-between px-1.5 py-1 mb-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className={cn("size-2 rounded-full", STAGE_DOT[stage.key])} /> {stage.label}
                </span>
                <span className="text-xs text-muted-fg">{tasks.length}</span>
              </header>
              <ul className="space-y-2 min-h-[3rem]">
                {tasks.map((t, i) => (
                  <motion.li key={t.id} layout data-card={t.id} className="relative">
                    <div
                      draggable={canEdit}
                      role="button"
                      tabIndex={0}
                      aria-label={`${t.title}. Open task`}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenTask(t.id))}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(t.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropAt(null);
                      }}
                      className={cn(
                        "rounded-[10px] border border-border bg-background p-3 cursor-pointer hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring",
                        dragId === t.id && "opacity-40",
                      )}
                      onClick={() => setOpenTask(t.id)}
                    >
                      {dropAt?.stage === stage.key && dropAt.index === i && dragId !== t.id && (
                        <span className="absolute -top-1.5 inset-x-2 h-0.5 rounded bg-primary" aria-hidden="true" />
                      )}
                      <p className={cn("text-sm font-medium", t.stage === "done" && "line-through text-muted-fg")}>{t.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-fg">
                        {t.priority !== "normal" && (
                          <span className={cn("flex items-center gap-1 capitalize", PRIORITY_STYLE[t.priority])}><Flag size={11} /> {t.priority}</span>
                        )}
                        {t.dueDate && (
                          <span className={cn("flex items-center gap-1", t.overdue && "text-danger font-medium")}><CalendarDays size={11} /> {formatDate(t.dueDate)}</span>
                        )}
                        {t.loggedMinutes > 0 && <span className="flex items-center gap-1"><Clock size={11} /> {hours(t.loggedMinutes)}</span>}
                        {t.assignee && (
                          <span className="ml-auto size-5 rounded-full bg-primary-tint text-primary flex items-center justify-center text-[10px] font-semibold" title={t.assignee.name}>
                            {t.assignee.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
                {dragId && dropAt?.stage === stage.key && dropAt.index === tasks.filter((t) => t.id !== dragId).length && (
                  <li className="h-0.5 mx-2 rounded bg-primary" aria-hidden="true" />
                )}
              </ul>
              {canEdit && (
                <form
                  className="mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    quickAdd(stage.key);
                  }}
                >
                  <Input
                    value={newTitle[stage.key] ?? ""}
                    onChange={(e) => setNewTitle((n) => ({ ...n, [stage.key]: e.target.value }))}
                    placeholder="+ Add a task"
                    aria-label={`Add a task to ${stage.label}`}
                    className="h-8 bg-transparent border-dashed text-sm"
                  />
                </form>
              )}
            </section>
          );
        })}
      </div>

      <AnimatePresence>
        {openTask && (
          <TaskPanel
            key={openTask}
            taskId={openTask}
            project={project}
            members={members}
            canEdit={canEdit}
            onClose={() => setOpenTask(null)}
            onChanged={(t) => {
              patchLocal(t);
            }}
            onDeleted={(id) => {
              setOpenTask(null);
              setProject((p) => (p ? { ...p, tasks: p.tasks.filter((x) => x.id !== id), taskCount: p.taskCount - 1 } : p));
            }}
            onTimeLogged={reload}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

function Milestones({
  project,
  canEdit,
  filter,
  setFilter,
  onChange,
}: {
  project: ProjectDetail;
  canEdit: boolean;
  filter: string | null;
  setFilter: (id: string | null) => void;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [due, setDue] = useState("");

  async function add() {
    try {
      await createMilestone(project.id, { name: name.trim(), dueDate: due || null });
      setName("");
      setDue("");
      setAdding(false);
      onChange();
    } catch (e) {
      toast.error(errorText(e, "Could not add the milestone"));
    }
  }

  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">Milestones</p>
        {canEdit && !adding && (
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => setAdding(true)}>+ Add</button>
        )}
      </div>
      {adding ? (
        <div className="mt-2 space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cutover weekend" className="h-8" autoFocus aria-label="Milestone name" />
          <div className="flex gap-2">
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-8" aria-label="Milestone due date" />
            <Button size="sm" onClick={add} disabled={name.trim().length < 2}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : project.milestones.length === 0 ? (
        <p className="text-sm text-muted-fg mt-1">None yet</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {project.milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              <button
                type="button"
                disabled={!canEdit}
                aria-label={m.done ? `Mark ${m.name} not done` : `Mark ${m.name} done`}
                onClick={async () => {
                  await updateMilestone(m.id, { done: !m.done });
                  onChange();
                }}
              >
                {m.done ? <CheckCircle2 size={14} className="text-success" /> : <Circle size={14} className="text-muted-fg" />}
              </button>
              <button
                type="button"
                onClick={() => setFilter(filter === m.id ? null : m.id)}
                className={cn("truncate text-left hover:underline", filter === m.id && "font-semibold text-primary", m.done && "line-through text-muted-fg")}
                title="Show only this milestone's tasks"
              >
                {m.name}
              </button>
              <span className="ml-auto text-xs text-muted-fg flex-none">
                {m.doneCount}/{m.taskCount}
                {m.dueDate ? ` · ${formatDate(m.dueDate)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskPanel({
  taskId,
  project,
  members,
  canEdit,
  onClose,
  onChanged,
  onDeleted,
  onTimeLogged,
}: {
  taskId: string;
  project: ProjectDetail;
  members: TeamMember[];
  canEdit: boolean;
  onClose: () => void;
  onChanged: (t: Task) => void;
  onDeleted: (id: string) => void;
  onTimeLogged: () => void;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState({ hours: "", minutes: "", note: "", billable: project.billingType === "hourly" });
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTask(taskId).then((t) => {
      setTask(t);
      setDesc(t.description ?? "");
    });
  }, [taskId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(body: Parameters<typeof updateTask>[1]) {
    if (!task) return;
    try {
      const updated = await updateTask(task.id, body);
      setTask({ ...task, ...updated });
      onChanged(updated);
    } catch (e) {
      toast.error(errorText(e, "Could not save the task"));
    }
  }

  async function addTime() {
    if (!task) return;
    const minutes = (Number(time.hours) || 0) * 60 + (Number(time.minutes) || 0);
    try {
      const entry = await logTime(task.id, { minutes, note: time.note || undefined, billable: time.billable });
      setTask({ ...task, loggedMinutes: task.loggedMinutes + minutes, timeEntries: [entry, ...(task.timeEntries ?? [])] });
      setTime({ ...time, hours: "", minutes: "", note: "" });
      onChanged({ ...task, loggedMinutes: task.loggedMinutes + minutes });
      onTimeLogged();
      toast.success(`${hours(minutes)} logged`);
    } catch (e) {
      toast.error(errorText(e, "Could not log the time"));
    }
  }

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Task"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl overflow-y-auto outline-none"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        {!task ? (
          <div className="p-6"><div className="h-40 animate-pulse rounded-[12px] bg-surface" /></div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Input
                defaultValue={task.title}
                disabled={!canEdit}
                aria-label="Task title"
                className="text-base font-semibold border-transparent px-0 focus:px-3"
                onBlur={(e) => e.target.value.trim() !== task.title && save({ title: e.target.value.trim() })}
              />
              <button type="button" onClick={onClose} aria-label="Close" className="mt-2 text-muted-fg hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-stage">Stage</Label>
                <select id="t-stage" disabled={!canEdit} value={task.stage} onChange={(e) => save({ stage: e.target.value as TaskStage })} className="h-9 w-full rounded-[8px] border border-input bg-background px-2 text-sm">
                  {project.stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-assignee">Assigned to</Label>
                <select id="t-assignee" disabled={!canEdit} value={task.assignee?.id ?? ""} onChange={(e) => save({ assigneeId: e.target.value || null })} className="h-9 w-full rounded-[8px] border border-input bg-background px-2 text-sm">
                  <option value="">Nobody</option>
                  {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.fullName || m.user.email}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-priority">Priority</Label>
                <select id="t-priority" disabled={!canEdit} value={task.priority} onChange={(e) => save({ priority: e.target.value as Priority })} className="h-9 w-full rounded-[8px] border border-input bg-background px-2 text-sm">
                  {["low", "normal", "high", "urgent"].map((p) => <option key={p} value={p} className="capitalize">{p[0].toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-due">Due</Label>
                <Input id="t-due" type="date" disabled={!canEdit} value={task.dueDate ?? ""} onChange={(e) => save({ dueDate: e.target.value || null })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-estimate">Estimate (hours)</Label>
                <Input id="t-estimate" type="number" min={0} step="0.25" disabled={!canEdit} defaultValue={task.estimateMinutes ? task.estimateMinutes / 60 : ""} onBlur={(e) => save({ estimateMinutes: Math.round((Number(e.target.value) || 0) * 60) })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-milestone">Milestone</Label>
                <select id="t-milestone" disabled={!canEdit} value={task.milestoneId ?? ""} onChange={(e) => save({ milestoneId: e.target.value || null })} className="h-9 w-full rounded-[8px] border border-input bg-background px-2 text-sm">
                  <option value="">None</option>
                  {project.milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Notes</Label>
              <Textarea id="t-desc" rows={4} disabled={!canEdit} value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== (task.description ?? "") && save({ description: desc })} placeholder="Details, links, what done looks like…" />
            </div>

            <div className="rounded-[12px] border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg flex items-center gap-1.5"><Clock size={12} /> Time</span>
                <span className="text-sm font-mono">
                  {hours(task.loggedMinutes)}
                  {task.estimateMinutes ? <span className="text-muted-fg"> / {hours(task.estimateMinutes)}</span> : null}
                </span>
              </div>
              {canEdit && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_2fr] gap-2">
                    <Input type="number" min={0} value={time.hours} onChange={(e) => setTime({ ...time, hours: e.target.value })} placeholder="h" aria-label="Hours" className="h-9" />
                    <Input type="number" min={0} max={59} value={time.minutes} onChange={(e) => setTime({ ...time, minutes: e.target.value })} placeholder="min" aria-label="Minutes" className="h-9" />
                    <Input value={time.note} onChange={(e) => setTime({ ...time, note: e.target.value })} placeholder="What did you do?" aria-label="Time note" className="h-9" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-fg">
                      <input type="checkbox" checked={time.billable} onChange={(e) => setTime({ ...time, billable: e.target.checked })} /> Billable
                    </label>
                    <Button size="sm" variant="outline" onClick={addTime} disabled={!((Number(time.hours) || 0) * 60 + (Number(time.minutes) || 0))}>
                      <Plus size={14} className="mr-1" /> Log time
                    </Button>
                  </div>
                </div>
              )}
              {(task.timeEntries ?? []).length > 0 && (
                <ul className="divide-y divide-border text-sm">
                  {task.timeEntries!.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="min-w-0 truncate text-muted-fg">
                        {formatDate(e.workDate)} · {e.user?.name}
                        {e.note ? ` · ${e.note}` : ""}
                      </span>
                      <span className="flex-none font-mono text-xs">
                        {hours(e.minutes)}
                        {e.invoiced ? " · billed" : !e.billable ? " · not billed" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canEdit && (
              <Button
                variant="ghost"
                className="text-danger hover:text-danger hover:bg-danger-bg"
                onClick={async () => {
                  if (!window.confirm(`Delete “${task.title}”?`)) return;
                  try {
                    await deleteTask(task.id);
                    onDeleted(task.id);
                  } catch (e) {
                    toast.error(errorText(e, "Could not delete the task"));
                  }
                }}
              >
                <Trash2 size={14} className="mr-1.5" /> Delete task
              </Button>
            )}
          </div>
        )}
      </motion.aside>
    </>
  );
}

export function MyTasks() {
  const [rows, setRows] = useState<Task[] | null>(null);
  useEffect(() => {
    listMyTasks().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <PageContainer>
      <h1 className="page-title mb-1">My tasks</h1>
      <p className="text-sm text-muted-fg mb-6">Everything assigned to you that isn&apos;t done yet, soonest first.</p>
      {rows === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-success" size={22} />
          <p className="font-semibold">Nothing assigned to you</p>
          <p className="text-sm text-muted-fg mt-1">Tasks assigned to you on any project show up here.</p>
        </div>
      ) : (
        <ul className="rounded-[12px] border border-border bg-background divide-y divide-border">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/projects/${t.projectId}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface">
                <span className={cn("size-2 rounded-full flex-none", STAGE_DOT[t.stage])} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium truncate">{t.title}</span>
                  <span className="block text-xs text-muted-fg truncate">{t.projectName}</span>
                </span>
                {t.priority !== "normal" && <span className={cn("text-xs capitalize", PRIORITY_STYLE[t.priority])}>{t.priority}</span>}
                {t.dueDate && <span className={cn("text-xs", t.overdue ? "text-danger font-medium" : "text-muted-fg")}>{t.overdue ? "Overdue · " : ""}{formatDate(t.dueDate)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
