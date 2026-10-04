"use client";
import { useState, useTransition } from "react";
import { analyzeUpload, parseUpload, submitUpload, type AnalyzeResult } from "@/app/actions/upload";
import { CATEGORIES } from "@/lib/categories";
import type { UploadAnalysis } from "@/lib/upload";

type Step = "input" | "confirm";

export function UploadFlow({ preferredQuestionId, edit }: { preferredQuestionId: string | null; edit: { id: string; text: string } | null }) {
  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState(edit?.text ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [paras, setParas] = useState<string[]>([]);
  const [res, setRes] = useState<AnalyzeResult | null>(null);
  const [err, setErr] = useState("");
  const [busy, start] = useTransition();

  // confirm-step form state
  const [title, setTitle] = useState("");
  const [qid, setQid] = useState<string>("");
  const [newQ, setNewQ] = useState("");
  const [cat, setCat] = useState("");
  const [line, setLine] = useState("");
  const [cut, setCut] = useState(1);
  const [aiUsage, setAiUsage] = useState<"" | "none" | "polish" | "draft">("");
  const [rights, setRights] = useState(false);
  const [label, setLabel] = useState(false);

  const chars = text.replace(/\s/g, "").length;

  function analyze() {
    setErr("");
    start(async () => {
      const fd = new FormData();
      if (file) fd.set("file", file);
      else fd.set("text", text);
      const parsed = await parseUpload(fd);
      if (parsed.error || !parsed.paragraphs) return setErr(parsed.error ?? "读取失败");
      const r = await analyzeUpload(parsed.paragraphs, preferredQuestionId);
      if (r.error || !r.analysis) return setErr(r.error ?? "分析失败");
      const a: UploadAnalysis = r.analysis;
      setParas(parsed.paragraphs);
      setRes(r);
      setTitle(a.titles[0] ?? "");
      setQid(a.questionId ?? "");
      setNewQ(a.newQuestion);
      setCat(a.category);
      setLine(a.line);
      setCut(a.paywallAfter);
      setStep("confirm");
      window.scrollTo({ top: 0 });
    });
  }

  function submit() {
    setErr("");
    start(async () => {
      const r = await submitUpload({
        paragraphs: paras,
        title,
        questionId: qid || null,
        newQuestion: newQ,
        category: cat,
        line,
        paywallAfter: cut,
        aiUsage: (aiUsage || "none") as "none",
        rights: rights as true,
        label: label as true,
        analysis: res?.analysis,
        dupScore: res?.dup?.sim ?? 0,
        dupStoryId: res?.dup?.id ?? null,
        editId: edit?.id ?? null,
      });
      if (r?.error) setErr(r.error);
    });
  }

  if (step === "input")
    return (
      <div className="sec">
        <p className="small" style={{ margin: 0 }}>
          第 1 步 / 共 2 步：放入正文。每段之间换行。至少 300 字。
        </p>
        <div className="field">
          <label htmlFor="up-file">选择文件（.txt / .md / .docx，不超过 4 MB）</label>
          <input id="up-file" type="file" accept=".txt,.md,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        {!file && (
          <div className="field">
            <label htmlFor="up-text">或者直接粘贴正文</label>
            <textarea id="up-text" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 260 }} />
            <span className="small">{chars.toLocaleString()} 字</span>
          </div>
        )}
        {err && <span className="err">{err}</span>}
        <div className="btnrow">
          <button className="btn" disabled={busy || (!file && chars < 300)} onClick={analyze}>
            {busy ? "正在分析…" : "下一步：AI 分析"}
          </button>
        </div>
      </div>
    );

  const a = res!.analysis!;
  const qs = res!.questions ?? [];
  const canSubmit = title.trim().length >= 4 && (qid || newQ.trim().length >= 6) && cat && aiUsage && rights && label;
  return (
    <div className="sec">
      <p className="small" style={{ margin: 0 }}>
        第 2 步 / 共 2 步：确认后提交编辑审核。{a.source === "ai" ? "以下是 AI 的建议，都可以改。" : ""}
      </p>
      {res!.dup ? (
        <div className="notice bad">
          <b>查重提醒：</b>开头和已上线的《{res!.dup.title}》相似度 {Math.round(res!.dup.sim * 100)}%。如果这是你的作品或你有授权，可以继续提交，编辑会核实。
        </div>
      ) : (
        <div className="notice good">查重通过：没有发现和已上线故事相似的开头。</div>
      )}
      <div className="card soft">
        <span className="small">{paras.length} 段 · {paras.join("").replace(/\s/g, "").length.toLocaleString()} 字 · 前三段{a.hookOk ? "有钩子" : "钩子偏弱"}</span>
        {a.notes.map((n, i) => (
          <span key={i} className="small">
            · {n}
          </span>
        ))}
      </div>

      <div className="field">
        <label htmlFor="up-title">标题</label>
        <div className="btnrow">
          {a.titles.map((t) => (
            <button key={t} type="button" className="btn small ghost" aria-pressed={title === t} onClick={() => setTitle(t)}>
              {title === t ? "✓ " : ""}
              {t}
            </button>
          ))}
        </div>
        <input id="up-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
      </div>

      <div className="field">
        <label htmlFor="up-q">挂在哪个问题下</label>
        <select id="up-q" value={qid} onChange={(e) => setQid(e.target.value)}>
          <option value="">新建一个问题</option>
          {qs.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </select>
        {!qid && <input id="up-newq" type="text" value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="写一个能引出这个故事的问题，用“你”提问" maxLength={60} />}
      </div>

      <div className="field">
        <label htmlFor="up-cat">题材</label>
        <select id="up-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="up-line">一句话故事（给编辑看）</label>
        <input id="up-line" type="text" value={line} onChange={(e) => setLine(e.target.value)} maxLength={80} />
      </div>

      <div className="field">
        <label>
          付费点：第 {cut} 段之后（免费部分约 {Math.round((paras.slice(0, cut).join("").length / Math.max(1, paras.join("").length)) * 100)}%）
        </label>
        <div className="cut">
          <span>{paras[cut - 1]}</span>
          <div className="cutline">付费点 · 下面的内容需要登录或解锁</div>
          <span style={{ color: "var(--muted)" }}>{paras[cut]}</span>
        </div>
        <div className="btnrow">
          <button type="button" className="btn small ghost" disabled={cut <= 1} onClick={() => setCut(cut - 1)}>
            往前一段
          </button>
          <button type="button" className="btn small ghost" disabled={cut >= paras.length - 1} onClick={() => setCut(cut + 1)}>
            往后一段
          </button>
          <button type="button" className="btn small ghost" onClick={() => setCut(a.paywallAfter)}>
            恢复推荐（第 {a.paywallAfter} 段）
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="up-ai">是否使用了 AI</label>
        <select id="up-ai" value={aiUsage} onChange={(e) => setAiUsage(e.target.value as typeof aiUsage)}>
          <option value="" disabled>
            请选择
          </option>
          <option value="none">没有使用</option>
          <option value="polish">AI 辅助润色</option>
          <option value="draft">AI 生成初稿，我修改</option>
        </select>
      </div>
      <label className="chk">
        <input id="up-rights" type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />
        这篇作品是我原创，或者我已获得授权，可以在平台发布和改编
      </label>
      <label className="chk">
        <input id="up-label" type="checkbox" checked={label} onChange={(e) => setLabel(e.target.checked)} />
        同意平台把它标注为“故事”，不宣称是真实事件
      </label>
      {err && <span className="err">{err}</span>}
      <div className="btnrow">
        <button className="btn" disabled={busy || !canSubmit} onClick={submit}>
          {busy ? "正在提交…" : "提交编辑审核"}
        </button>
        <button className="btn ghost" disabled={busy} onClick={() => setStep("input")}>
          返回修改正文
        </button>
      </div>
    </div>
  );
}
