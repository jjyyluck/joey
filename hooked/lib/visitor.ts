import "server-only";
import { cookies } from "next/headers";

/** Anonymous visitor id set by proxy.ts. */
export async function visitorId(): Promise<string | null> {
  return (await cookies()).get("hk_vid")?.value ?? null;
}
