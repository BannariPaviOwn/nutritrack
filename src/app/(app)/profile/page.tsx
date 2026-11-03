import { ProfileForm } from "@/components/ProfileForm";
import { Alert, Button, Card, PageHeader } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfile } from "@/lib/data/profiles";
import { dataModeLabel } from "@/lib/mode";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
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
        subtitle="Height and goals stay on your account only."
      />
      <Card>
        <ProfileForm profile={profile} />
      </Card>

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
