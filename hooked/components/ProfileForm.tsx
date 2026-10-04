"use client";
import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const [s, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="sec">
      <div className="field">
        <label htmlFor="name">昵称（2–16 字）</label>
        <input id="name" name="name" type="text" defaultValue={name} maxLength={16} required />
      </div>
      <div className="field">
        <label htmlFor="bio">一句话签名（最多 40 字，显示在你的故事上方）</label>
        <input id="bio" name="bio" type="text" defaultValue={bio} maxLength={40} />
      </div>
      {s.error && <span className="err">{s.error}</span>}
      <button className="btn" disabled={pending}>
        保存
      </button>
    </form>
  );
}
