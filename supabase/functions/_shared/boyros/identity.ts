import type {
  BoyRosIdentityContext,
  BoyRosSignal,
} from "./types.ts";

export function belongsToIdentity(
  signal: BoyRosSignal,
  identity: BoyRosIdentityContext,
): boolean {
  if (signal.userId !== identity.userId) {
    return false;
  }

  if (
    identity.organisationId &&
    signal.organisationId &&
    signal.organisationId !==
      identity.organisationId
  ) {
    return false;
  }

  return true;
}

export function filterIdentitySignals(
  signals: BoyRosSignal[],
  identity: BoyRosIdentityContext,
): {
  accepted: BoyRosSignal[];
  rejected: BoyRosSignal[];
} {
  const accepted: BoyRosSignal[] = [];
  const rejected: BoyRosSignal[] = [];

  for (const signal of signals) {
    if (belongsToIdentity(signal, identity)) {
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