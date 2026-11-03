import { MeasuresForm } from "@/components/MeasuresForm";
import { OnboardingBasicsForm } from "@/components/OnboardingBasicsForm";
import { Alert, Card, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBodyForDate } from "@/lib/data/body";
import { getOnboardingStatus } from "@/lib/data/onboarding";
import { getProfile } from "@/lib/data/profiles";
import { todayISO } from "@/lib/dates";
import { formatHeight, normalizeHeightUnit } from "@/lib/units";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const status = await getOnboardingStatus();
  if (status.complete) redirect("/today");

  const [profile, todayLog] = await Promise.all([
    getProfile(),
    getBodyForDate(todayISO()),
  ]);

  if (!profile) {
    return (
      <div>
        <PageHeader title="Get started" />
        <Alert>Profile not found. Try signing out and back in.</Alert>
      </div>
    );
  }

  const needsBasics = !status.hasGender || !status.hasHeight;

  return (
    <div>
      <PageHeader
        title="Set up your body basics"
        subtitle="Add gender, height, and waist / hip / thigh once — then you can use the rest of NutriTrack."
      />

      <Alert>
        Add your waist, hip, and thigh to continue
        {needsBasics ? " (gender and height are required too)" : ""}.
      </Alert>

      {needsBasics ? (
        <Card className="mt-4">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            About you
          </h2>
          <OnboardingBasicsForm
            profile={profile}
            requireGender={!status.hasGender}
            requireHeight={!status.hasHeight}
          />
        </Card>
      ) : (
        <Card className="mt-4 space-y-1">
          <p className="text-sm text-slate-600">
            Gender:{" "}
            <span className="font-semibold capitalize text-slate-900">
              {profile.gender}
            </span>
          </p>
          <p className="text-sm text-slate-600">
            Height:{" "}
            <span className="font-semibold text-slate-900">
              {formatHeight(
                profile.height_cm,
                normalizeHeightUnit(profile.height_unit),
              )}
            </span>
          </p>
        </Card>
      )}

      {!status.hasCompleteMeasures ? (
        <Card className="mt-4">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            First measurements (inches)
          </h2>
          <MeasuresForm
            defaultDate={todayISO()}
            next="/onboarding"
            defaults={{
              waist_in: todayLog?.waist_in,
              hip_in: todayLog?.hip_in,
              thigh_in: todayLog?.thigh_in,
            }}
          />
        </Card>
      ) : (
        <Card className="mt-4">
          <p className="text-sm text-slate-600">
            Waist, hip, and thigh are saved. Finish the basics above if still needed.
          </p>
        </Card>
      )}
    </div>
  );
}
