import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { AskFab, Nav } from "@/components/Nav";
import { getUser } from "@/lib/auth";
import { unreadCount } from "@/lib/queries";
import { META_DESCRIPTION } from "@/lib/positioning";

export const metadata: Metadata = {
  title: { default: "Hooked · 有个故事", template: "%s · Hooked" },
  description: META_DESCRIPTION,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const unread = user ? await unreadCount(user.id) : 0;
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700;900&family=Noto+Sans+SC:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <div className="app">
          <header className="topbar">
            <Link href="/" className="logo">
              Hook<span>ed</span>
            </Link>
            <span className="chip">有个故事</span>
            <span className="sp" />
            {user ? (
              <Link href="/me/notifications" className="chip" aria-label={`通知，${unread} 条未读`}>
                通知{unread ? ` · ${unread}` : ""}
              </Link>
            ) : (
              <Link href="/login" className="btn small">
                登录
              </Link>
            )}
          </header>
          <main className="main">{children}</main>
          <AskFab />
          <Nav />
        </div>
      </body>
    </html>
  );
}
