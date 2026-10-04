"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [s, action, pending] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={action} className="sec">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">邮箱</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={s.email} required />
      </div>
      <div className="field">
        <label htmlFor="password">密码</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {s.error && <span className="err">{s.error}</span>}
      <button className="btn" disabled={pending}>
        登录
      </button>
      <span className="small">
        还没有账号？<Link href={`/signup?next=${encodeURIComponent(next)}`} style={{ color: "var(--accent)" }}>注册</Link>
      </span>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [s, action, pending] = useActionState<AuthState, FormData>(signup, {});
  return (
    <form action={action} className="sec">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">邮箱</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={s.email} required />
      </div>
      <div className="field">
        <label htmlFor="name">昵称（公开显示）</label>
        <input id="name" name="name" type="text" maxLength={16} defaultValue={s.name} required />
      </div>
      <div className="field">
        <label htmlFor="password">密码（至少 8 位）</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <label className="chk">
        <input type="checkbox" name="age" id="age" /> 我已年满 13 岁
      </label>
      <label className="chk">
        <input type="checkbox" name="terms" id="terms" />
        <span>
          我同意
          <Link href="/legal/terms" style={{ color: "var(--accent)" }}>用户协议</Link>和
          <Link href="/legal/privacy" style={{ color: "var(--accent)" }}>隐私政策</Link>
        </span>
      </label>
      {s.error && <span className="err">{s.error}</span>}
      <button className="btn" disabled={pending}>
        注册
      </button>
      <span className="small">
        已有账号？<Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: "var(--accent)" }}>登录</Link>
      </span>
    </form>
  );
}
