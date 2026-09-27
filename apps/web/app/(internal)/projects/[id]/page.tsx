/**
 * @file app/(internal)/projects/[id]/page.tsx
 * @description A project's task board.
 */
"use client";

import { useParams } from "next/navigation";
import { ProjectBoard } from "@/components/modules/projects/project-board";

export default function ProjectPage() {
  const params = useParams();
  return <ProjectBoard projectId={params.id as string} />;
}
