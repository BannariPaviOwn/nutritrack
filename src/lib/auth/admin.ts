import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

/** Emails listed in ADMIN_EMAILS (comma-separated) may open /admin. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}

export async function currentUserIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && isAdminEmail(user.email));
}

/** Require a signed-in admin; redirect others away from /admin. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/today");
  return user;
}
