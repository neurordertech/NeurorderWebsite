import {
  buildContextText,
  getInstructions,
} from "./prompts.ts";

import type {
  NousContext,
  NousMode,
  NousRoute,
} from "./types.ts";

const validModes: NousMode[] = [
  "news",
  "calendar",
  "education",
  "business",
  "personal",
  "general",
];

export function isNousMode(
  value: unknown,
): value is NousMode {
  return (
    typeof value === "string" &&
    validModes.includes(value as NousMode)
  );
}

export function resolveNousMode(
  requestedMode: unknown,
): NousMode {
  if (isNousMode(requestedMode)) {
    return requestedMode;
  }

  return "general";
}

export function routeNousRequest(
  requestedMode: unknown,
  context: NousContext | null,
): NousRoute {
  const mode =
    resolveNousMode(requestedMode);

  return {
    mode,
    instructions:
      getInstructions(mode),
    contextText:
      buildContextText(context),
  };
}

export function buildModelInput(
  message: string,
  route: NousRoute,
): string {
  return `
${route.contextText}

User message:

${message}
`.trim();
}