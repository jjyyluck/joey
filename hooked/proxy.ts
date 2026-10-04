import { NextResponse, type NextRequest } from "next/server";

// Give every browser an anonymous id so reads can be counted once per person per day.
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get("hk_vid")) {
    const id = crypto.randomUUID().replace(/-/g, "");
    res.cookies.set("hk_vid", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400, secure: process.env.NODE_ENV === "production" });
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"] };
