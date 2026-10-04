import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UploadFlow } from "@/components/UploadFlow";

export const metadata: Metadata = { title: "上传作品" };

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/create/upload" + (sp.q ? `?q=${sp.q}` : ""));
  const q = sp.q ? await db.question.findUnique({ where: { id: sp.q }, select: { id: true, title: true } }) : null;
  const edit = sp.edit
    ? await db.submission.findFirst({ where: { id: sp.edit, authorId: user.id, status: "CHANGES_REQUESTED" } })
    : null;
  return (
    <div className="pad">
      <h1 style={{ fontSize: 20 }}>{edit ? "修改投稿" : "上传作品"}</h1>
      {q && !edit && (
        <div className="notice good">
          将挂在问题下：<b>{q.title}</b>
        </div>
      )}
      {edit?.reviewNote && (
        <div className="notice warn">
          <b>编辑的修改意见：</b>
          {edit.reviewNote}
        </div>
      )}
      <UploadFlow
        preferredQuestionId={edit?.questionId ?? q?.id ?? null}
        edit={edit ? { id: edit.id, text: edit.paragraphs.join("\n") } : null}
      />
    </div>
  );
}
