import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { Alert, Button, Card, PageHeader } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { currentUserIsAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfile } from "@/lib/data/profiles";
import { dataModeLabel } from "@/lib/mode";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, isAdmin] = await Promise.all([
    getProfile(),
    currentUserIsAdmin(),
  ]);

  if (!profile) {
    return (
      <div>
        <PageHeader title="Profile" />
        <Alert>Profile not found. Try signing out and back in.</Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Height, gender, and goals stay on your account only."
      />
      <Card>
        <ProfileForm profile={profile} />
      </Card>

      {isAdmin ? (
        <Card className="mt-4">
          <p className="text-sm text-slate-600">
            Your email is listed in <span className="font-medium">ADMIN_EMAILS</span>.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-teal-800"
          >
            Open admin patient reports
          </Link>
        </Card>
      ) : null}

      <Card className="mt-4 space-y-3">
        <p className="text-sm text-slate-600">
          Storage:{" "}
          <span className="font-semibold text-slate-800">
            {dataModeLabel() === "local" ? "Local JSON (per machine)" : "Supabase"}
          </span>
        </p>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Log out
          </Button>
        </form>
      </Card>
    </div>
  );
}
