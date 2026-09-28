/**
 * @file app/(internal)/help/articles/[slug]/page.tsx
 * @description One help-centre article, with "did this help?" feedback.
 */
"use client";

import { useParams } from "next/navigation";
import { HelpArticleView } from "@/components/modules/help/help-client";

export default function HelpArticlePage() {
  const params = useParams();
  return <HelpArticleView slug={params.slug as string} />;
}
