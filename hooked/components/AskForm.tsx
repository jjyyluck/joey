"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { askQuestion, rewriteQuestion, type AskState } from "@/app/actions/questions";
import { CATEGORIES } from "@/lib/categories";

export function AskForm() {
  const [state, action, pending] = useActionState<AskState, FormData>(askQuestion, {});
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [opts, setOpts] = useState<string[]>([]);
  const [aiMsg, setAiMsg] = useState("");
  const [busy, start] = useTransition();
  const t = title || state.title || "";
  return (
    <form action={action} className="sec">
      <div className="field">
        <label htmlFor="title">问题</label>
        <textarea id="title" name="title" value={t} onChange={(e) => setTitle(e.target.value)} maxLength={60} style={{ minHeight: 80 }} placeholder="随便写一句也行，可以让 AI 帮你改写" />
        <span className="small">{t.length}/60</span>
      </div>
      <div className="btnrow">
        <button
          type="button"
          className="btn ghost small"
          disabled={busy || t.trim().length < 4}
          onClick={() =>
            start(async () => {
              const r = await rewriteQuestion(t);
              if (r.error) setAiMsg(r.error);
              else {
                setOpts(r.options ?? []);
                setAiMsg(r.ai ? "点一个直接使用" : "AI 未开启，以下是模板改写");
              }
            })
          }
        >
          {busy ? "正在改写…" : "AI 帮我改写成 3 个问法"}
        </button>
      </div>
      {aiMsg && <span className="small">{aiMsg}</span>}
      {opts.map((o) => (
        <button key={o} type="button" className="card soft" style={{ textAlign: "left" }} onClick={() => setTitle(o)}>
          {o}
        </button>
      ))}
      <div className="field">
        <label htmlFor="category">题材</label>
        <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="" disabled>
            选择题材
          </option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {state.error && <span className="err">{state.error}</span>}
      {state.similar && (
        <div className="notice warn">
          <b>已经有人问过类似的问题：</b>
          {state.similar.map((s) => (
            <div key={s.id}>
              <Link href={`/q/${s.id}`} style={{ textDecoration: "underline" }}>
                {s.title}
              </Link>
            </div>
          ))}
          <div className="small">去那里点“坐等”，会比新开一个问题更快等到故事。</div>
          <input type="hidden" name="force" value="1" />
        </div>
      )}
      <div className="btnrow">
        <button className="btn" disabled={pending}>
          {state.similar ? "仍然发布我的问题" : "发布问题"}
        </button>
      </div>
    </form>
  );
}
