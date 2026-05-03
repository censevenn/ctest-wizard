/** Guest profile keyed by 6-digit code in localStorage. */

export const GUEST_CODE_STORAGE_KEY = "ctest-guest-code";

export function guestProfileStorageKey(code: string): string {
  return `ctest-guest-profile-${code}`;
}

export type GuestProfile = {
  textsCompleted: number;
  checksTotal: number;
  sumAccuracyPercent: number;
  bestTimeSeconds: number | null;
  sumCompletionSeconds: number;
  timedCompletions: number;
};

export function defaultGuestProfile(): GuestProfile {
  return {
    textsCompleted: 0,
    checksTotal: 0,
    sumAccuracyPercent: 0,
    bestTimeSeconds: null,
    sumCompletionSeconds: 0,
    timedCompletions: 0,
  };
}

export function normalizeGuestCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function isValidGuestCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function loadGuestCode(): string | null {
  if (typeof window === "undefined") return null;
  const c = localStorage.getItem(GUEST_CODE_STORAGE_KEY);
  return c && isValidGuestCode(c) ? c : null;
}

export function saveGuestCode(code: string): void {
  localStorage.setItem(GUEST_CODE_STORAGE_KEY, code);
}

export function clearGuestCode(): void {
  localStorage.removeItem(GUEST_CODE_STORAGE_KEY);
}

export function loadGuestProfile(code: string): GuestProfile {
  if (typeof window === "undefined") return defaultGuestProfile();
  try {
    const raw = localStorage.getItem(guestProfileStorageKey(code));
    if (!raw) return defaultGuestProfile();
    const p = JSON.parse(raw) as Partial<GuestProfile>;
    const d = defaultGuestProfile();
    return {
      textsCompleted: typeof p.textsCompleted === "number" ? p.textsCompleted : d.textsCompleted,
      checksTotal: typeof p.checksTotal === "number" ? p.checksTotal : d.checksTotal,
      sumAccuracyPercent:
        typeof p.sumAccuracyPercent === "number" ? p.sumAccuracyPercent : d.sumAccuracyPercent,
      bestTimeSeconds:
        p.bestTimeSeconds === undefined
          ? d.bestTimeSeconds
          : (p.bestTimeSeconds as number | null),
      sumCompletionSeconds:
        typeof p.sumCompletionSeconds === "number" ? p.sumCompletionSeconds : d.sumCompletionSeconds,
      timedCompletions: typeof p.timedCompletions === "number" ? p.timedCompletions : d.timedCompletions,
    };
  } catch {
    return defaultGuestProfile();
  }
}

export function persistGuestProfile(code: string, profile: GuestProfile): void {
  localStorage.setItem(guestProfileStorageKey(code), JSON.stringify(profile));
}

export function averageAccuracyPercent(profile: GuestProfile): number | null {
  if (profile.checksTotal <= 0) return null;
  return profile.sumAccuracyPercent / profile.checksTotal;
}

export function averageCompletionSeconds(profile: GuestProfile): number | null {
  if (profile.timedCompletions <= 0) return null;
  return profile.sumCompletionSeconds / profile.timedCompletions;
}

/** Merge stats after the user checks answers (guest code must already be validated). */
export function mergeGuestProfileAfterCheck(
  profile: GuestProfile,
  args: {
    accuracyPercent: number;
    allGapsFilled: boolean;
    durationSeconds: number | null;
  }
): GuestProfile {
  const next: GuestProfile = {
    ...profile,
    checksTotal: profile.checksTotal + 1,
    sumAccuracyPercent: profile.sumAccuracyPercent + args.accuracyPercent,
  };
  if (args.allGapsFilled) {
    next.textsCompleted = profile.textsCompleted + 1;
    if (args.durationSeconds != null && args.durationSeconds > 0) {
      next.timedCompletions = profile.timedCompletions + 1;
      next.sumCompletionSeconds = profile.sumCompletionSeconds + args.durationSeconds;
      const prev = profile.bestTimeSeconds;
      next.bestTimeSeconds =
        prev == null ? args.durationSeconds : Math.min(prev, args.durationSeconds);
    }
  }
  return next;
}
