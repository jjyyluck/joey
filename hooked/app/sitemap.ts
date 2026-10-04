import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, questions] = await Promise.all([
    db.story.findMany({ where: { status: "PUBLISHED" }, select: { id: true, publishedAt: true }, take: 5000 }),
    db.question.findMany({ where: { hidden: false }, select: { id: true, createdAt: true }, take: 5000 }),
  ]);
  return [
    { url: SITE.url },
    ...stories.map((s) => ({ url: `${SITE.url}/s/${s.id}`, lastModified: s.publishedAt })),
    ...questions.map((q) => ({ url: `${SITE.url}/q/${q.id}`, lastModified: q.createdAt })),
  ];
}
