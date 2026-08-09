import {
  filterIdentitySignals,
} from "./identity.ts";

import {
  filterPermittedSignals,
} from "./permissions.ts";

import {
  calculateSignalScore,
  determinePriority,
  sortSignals,
} from "./signals.ts";

import type {
  BoyRosInput,
  BoyRosResult,
  BoyRosSignal,
} from "./types.ts";

function buildContext(
  signals: BoyRosSignal[],
): BoyRosResult["contextForOrule"] {
  const currentFocus: string[] = [];
  const upcomingCommitments: string[] = [];
  const possibleRisks: string[] = [];
  const possibleOpportunities: string[] = [];

  for (const signal of signals) {
    const statement =
      `${signal.title}: ${signal.summary}`;

    switch (signal.kind) {
      case "meeting":
      case "deadline":
      case "task":
        upcomingCommitments.push(statement);
        break;

      case "risk":
        possibleRisks.push(statement);
        break;

      case "opportunity":
        possibleOpportunities.push(statement);
        break;

      default:
        currentFocus.push(statement);
        break;
    }
  }

  return {
    currentFocus: currentFocus.slice(0, 8),
    upcomingCommitments:
      upcomingCommitments.slice(0, 8),
    possibleRisks: possibleRisks.slice(0, 8),
    possibleOpportunities:
      possibleOpportunities.slice(0, 8),
  };
}

export function runBoyRos(
  input: BoyRosInput,
): BoyRosResult {
  const identityFiltered =
    filterIdentitySignals(
      input.signals,
      input.identity,
    );

  const permissionFiltered =
    filterPermittedSignals(
      identityFiltered.accepted,
      input.consent,
    );

  const acceptedSignals =
    sortSignals(permissionFiltered.accepted);

  const rejectedSignalCount =
    identityFiltered.rejected.length +
    permissionFiltered.rejected.length;

  const highestScore =
    acceptedSignals.length > 0
      ? calculateSignalScore(
          acceptedSignals[0],
        )
      : 0;

  const observations =
    acceptedSignals.slice(0, 5).map(
      (signal) => ({
        source: signal.source,
        title: signal.title,
        summary: signal.summary,
        score:
          calculateSignalScore(signal),
      }),
    );

  return {
    userId: input.identity.userId,
    organisationId:
      input.identity.organisationId,

    processedAt: new Date().toISOString(),

    acceptedSignalCount:
      acceptedSignals.length,

    rejectedSignalCount,

    priority:
      determinePriority(highestScore),

    observations,

    contextForOrule:
      buildContext(acceptedSignals),
  };
}