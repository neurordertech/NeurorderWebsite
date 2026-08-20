import type {
  BoyRosConsentContext,
  BoyRosSignal,
} from "./types.ts";

export function hasRequiredPermissions(
  signal: BoyRosSignal,
  consent: BoyRosConsentContext,
): boolean {
  const granted = new Set(
    consent.grantedPermissions,
  );

  const revoked = new Set(
    consent.revokedPermissions,
  );

  return signal.requiredPermissions.every(
    (permission) =>
      granted.has(permission) &&
      !revoked.has(permission),
  );
}

export function filterPermittedSignals(
  signals: BoyRosSignal[],
  consent: BoyRosConsentContext,
): {
  accepted: BoyRosSignal[];
  rejected: BoyRosSignal[];
} {
  const accepted: BoyRosSignal[] = [];
  const rejected: BoyRosSignal[] = [];

  for (const signal of signals) {
    if (hasRequiredPermissions(signal, consent)) {
      accepted.push(signal);
    } else {
      rejected.push(signal);
    }
  }

  return {
    accepted,
    rejected,
  };
}