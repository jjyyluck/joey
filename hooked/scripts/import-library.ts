/**
 * Imports the licensed story library.
 *   npm run import:library -- /path/to/lib
 * The folder must contain index.json ([{id,t,c,q,n,cut,k}]) and c<k>.json chunks ({ [id]: string[] }).
 * Stories keep their library id, so re-running is safe (existing ids are skipped).
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Entry = { id: string; t: string; c: string; q: string; n: number; cut: number; k: number };

const db = new PrismaClient();
const AUTHOR = process.env.LIBRARY_AUTHOR ?? "授权故事库";

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error("usage: npm run import:library -- /path/to/lib");
  const index: Entry[] = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
  const chunks = new Map<number, Record<string, string[]>>();
  const questions = new Set((await db.question.findMany({ select: { id: true } })).map((q) => q.id));
  let created = 0, skipped = 0, missing = 0;
  for (const e of index) {
    if (!questions.has(e.q)) {
      missing++;
      continue;
    }
    if (await db.story.findUnique({ where: { id: e.id }, select: { id: true } })) {
      skipped++;
      continue;
    }
    if (!chunks.has(e.k)) chunks.set(e.k, JSON.parse(readFileSync(join(dir, `c${e.k}.json`), "utf8")));
    const paragraphs = (chunks.get(e.k)![e.id] ?? []).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length < 2) {
      missing++;
      continue;
    }
    const text = paragraphs.join("");
    await db.story.create({
      data: {
        id: e.id,
        questionId: e.q,
        authorName: AUTHOR,
        title: e.t,
        paragraphs,
        paywallAfter: Math.min(Math.max(1, e.cut), paragraphs.length - 1),
        charCount: text.replace(/\s/g, "").length,
        preview: text.slice(0, 200),
        licensed: true,
      },
    });
    created++;
  }
  console.log(`created ${created}, skipped ${skipped}, missing question or text ${missing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
