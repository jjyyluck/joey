"use client";
import { useEffect, useState } from "react";
import { READER_PITCH } from "@/lib/positioning";

const KEY = "hk_intro_closed";

/** One-time strip for first-time visitors (mostly ad traffic) that says what kind of reading this is. */
export function ReaderIntro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="intro" role="note">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <b className="serif" style={{ fontSize: 17, flex: 1 }}>
          {READER_PITCH.tagline}
        </b>
        <button
          className="linkb"
          aria-label="关闭介绍"
          onClick={() => {
            setShow(false);
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
          }}
        >
          ✕
        </button>
      </div>
      <div className="pitch3">
        {READER_PITCH.points.map(([k, v]) => (
          <div key={k}>
            <b>{k}</b>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
