import { BottomNav } from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatus } from "@/lib/data/onboarding";
import { redirect } from "next/navigation";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const status = await getOnboardingStatus();
  if (!status.complete) {
    redirect("/onboarding");
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
