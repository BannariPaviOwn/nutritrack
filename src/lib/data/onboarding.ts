"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { listBodyLogs } from "@/lib/data/body";
import { getProfile } from "@/lib/data/profiles";

export type OnboardingStatus = {
  complete: boolean;
  hasCompleteMeasures: boolean;
  hasHeight: boolean;
  hasGender: boolean;
};

function isCompleteBodyLog(log: {
  waist_in: number;
  hip_in: number;
  thigh_in: number | null;
}): boolean {
  return (
    log.waist_in > 0 &&
    log.hip_in > 0 &&
    log.thigh_in != null &&
    log.thigh_in > 0
  );
}

/**
 * First-time setup: gender, height, and at least one complete waist/hip/thigh log.
 * Steps are optional and not part of the gate.
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      complete: false,
      hasCompleteMeasures: false,
      hasHeight: false,
      hasGender: false,
    };
  }

  const [profile, logs] = await Promise.all([getProfile(), listBodyLogs(400)]);
  const hasCompleteMeasures = logs.some(isCompleteBodyLog);
  const hasHeight = profile?.height_cm != null && profile.height_cm > 0;
  const hasGender = profile?.gender === "male" || profile?.gender === "female";

  return {
    complete: hasCompleteMeasures && hasHeight && hasGender,
    hasCompleteMeasures,
    hasHeight,
    hasGender,
  };
}
