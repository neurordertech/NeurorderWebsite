import type {
  BoyRosPriority,
  BoyRosSignal,
} from "./types.ts";

function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

export function calculateSignalScore(
  signal: BoyRosSignal,
): number {
  const importance = clamp(signal.importance);
  const urgency = clamp(signal.urgency);
  const confidence = clamp(signal.confidence);

  return Math.round(
    importance * 0.4 +
    urgency * 0.4 +
    confidence * 0.2,
  );
}

export function determinePriority(
  score: number,
): BoyRosPriority {
  if (score >= 85) {
    return "urgent";
  }

  if (score >= 65) {
    return "important";
  }

  if (score >= 35) {
    return "normal";
  }

  return "low";
}

export function sortSignals(
  signals: BoyRosSignal[],
): BoyRosSignal[] {
  return [...signals].sort((left, right) => {
    return (
      calculateSignalScore(right) -
      calculateSignalScore(left)
    );
  });
}