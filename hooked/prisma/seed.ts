/**
 * Seeds editor questions, an optional admin account and (with SEED_DEMO=1) a few short demo stories.
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import data from "./seed-data.json";

const db = new PrismaClient();
const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

async function hash(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${(await scrypt(pw, salt, 64)).toString("hex")}`;
}

async function main() {
  for (const q of data.questions) {
    await db.question.upsert({
      where: { id: q.id },
      create: { id: q.id, title: q.title, category: q.category, source: "editor" },
      update: { title: q.title, category: q.category },
    });
  }
  console.log(`questions: ${data.questions.length}`);

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
    const email = ADMIN_EMAIL.toLowerCase();
    await db.user.upsert({
      where: { email },
      create: { email, name: ADMIN_NAME ?? "编辑部", passwordHash: await hash(ADMIN_PASSWORD), role: "ADMIN" },
      update: { role: "ADMIN" },
    });
    console.log(`admin: ${email}`);
  }

  if (process.env.SEED_DEMO === "1") {
    for (const s of data.stories) {
      const title = s.paragraphs[0].split(/[。！？]/)[0].slice(0, 30);
      const text = s.paragraphs.join("");
      await db.story.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          questionId: s.questionId,
          authorName: s.authorName,
          title,
          paragraphs: s.paragraphs,
          paywallAfter: Math.min(3, s.paragraphs.length - 1),
          charCount: text.replace(/\s/g, "").length,
          preview: text.slice(0, 200),
        },
        update: {},
      });
    }
    console.log(`demo stories: ${data.stories.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
