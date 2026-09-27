/**
 * @file lib/api/projects.ts
 * @description Projects, milestones, tasks (board), time on tasks, invoicing project time.
 */
import { apiRequest } from "./client";

export type TaskStage = "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "normal" | "high" | "urgent";
export type BillingType = "hourly" | "fixed" | "non_billable";
export type ProjectStatus = "active" | "on_hold" | "done" | "cancelled";
export interface Person { id: string; name: string }

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  accountId: string | null;
  accountName: string | null;
  owner: Person | null;
  color: string | null;
  startDate: string | null;
  dueDate: string | null;
  billingType: BillingType;
  hourlyRate: number;
  fixedPrice: number;
  budgetHours: number;
  taskCount: number;
  doneCount: number;
  progress: number;
  loggedMinutes: number;
  unbilledMinutes: number;
  overdue: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string | null;
  stage: TaskStage;
  position: number;
  priority: Priority;
  milestoneId: string | null;
  assignee: Person | null;
  dueDate: string | null;
  estimateMinutes: number;
  loggedMinutes: number;
  overdue: boolean;
  completedAt: string | null;
  createdAt: string;
  timeEntries?: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  minutes: number;
  billable: boolean;
  note: string;
  workDate: string;
  user: Person | null;
  invoiced: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string | null;
  done: boolean;
  position: number;
  taskCount: number;
  doneCount: number;
}

export interface ProjectDetail extends Project {
  stages: Array<{ key: TaskStage; label: string }>;
  tasks: Task[];
  milestones: Milestone[];
}

export type ProjectInput = Partial<{
  name: string;
  description: string;
  status: ProjectStatus;
  accountId: string | null;
  ownerId: string | null;
  startDate: string | null;
  dueDate: string | null;
  billingType: BillingType;
  hourlyRate: number;
  fixedPrice: number;
  budgetHours: number;
}>;

export type TaskInput = Partial<{
  projectId: string;
  title: string;
  description: string;
  stage: TaskStage;
  position: number;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string | null;
  estimateMinutes: number;
  milestoneId: string | null;
}>;

export const listProjects = (status = "active") => apiRequest<Project[]>(`/projects?status=${status}`);
export const getProject = (id: string) => apiRequest<ProjectDetail>(`/projects/${id}`);
export const createProject = (body: ProjectInput) => apiRequest<Project>("/projects", { method: "POST", body });
export const updateProject = (id: string, body: ProjectInput) => apiRequest<Project>(`/projects/${id}`, { method: "PATCH", body });

export const listMyTasks = () => apiRequest<Task[]>("/projects/tasks?mine=1");
export const getTask = (id: string) => apiRequest<Task>(`/projects/tasks/${id}`);
export const createTask = (body: TaskInput) => apiRequest<Task>("/projects/tasks", { method: "POST", body });
export const updateTask = (id: string, body: TaskInput) => apiRequest<Task>(`/projects/tasks/${id}`, { method: "PATCH", body });
export const deleteTask = (id: string) => apiRequest<void>(`/projects/tasks/${id}`, { method: "DELETE" });
export const logTime = (id: string, body: { minutes: number; billable?: boolean; note?: string; workDate?: string }) =>
  apiRequest<TimeEntry>(`/projects/tasks/${id}/time`, { method: "POST", body });

export const createMilestone = (projectId: string, body: { name: string; dueDate?: string | null }) =>
  apiRequest<Milestone>(`/projects/${projectId}/milestones`, { method: "POST", body });
export const updateMilestone = (id: string, body: Partial<{ name: string; dueDate: string | null; done: boolean }>) =>
  apiRequest<Milestone>(`/projects/milestones/${id}`, { method: "PATCH", body });

export const invoiceProjectTime = (projectId: string) =>
  apiRequest<{ id: string; invoiceNumber: string; total: number }>(`/projects/${projectId}/invoice-time`, { method: "POST" });

export const hours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};
