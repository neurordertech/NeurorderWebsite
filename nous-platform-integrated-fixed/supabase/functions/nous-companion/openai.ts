import type {
  OpenAIResult,
} from "./types.ts";

type GenerateNousResponseOptions = {
  apiKey: string;
  instructions: string;
  input: string;
  previousResponseId?: string | null;
};

type OpenAIResponsePayload = {
  id?: string;
  model?: string;
  output_text?: string;

  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;

  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };

  error?: {
    message?: string;
  };
};

function extractOutputText(
  payload: OpenAIResponsePayload,
): string {
  if (
    typeof payload.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  for (const outputItem of payload.output ?? []) {
    if (outputItem.type !== "message") continue;

    for (const contentPart of outputItem.content ?? []) {
      if (
        contentPart.type === "output_text" &&
        typeof contentPart.text === "string"
      ) {
        return contentPart.text.trim();
      }
    }
  }

  return "";
}

export async function generateNousResponse(
  options: GenerateNousResponseOptions,
): Promise<OpenAIResult> {

  // Change this if your account later gains access to GPT-5.
  const MODEL = "gpt-5.6-luna";

  console.log("NOUS_DEPLOYMENT_VERSION: 2026-07-27-model-fix");
  console.log("NOUS_MODEL:", MODEL);

  const requestBody: Record<string, unknown> = {
    model: MODEL,
    instructions: options.instructions,
    input: options.input,
    max_output_tokens: 900,
  };

  if (options.previousResponseId) {
    requestBody.previous_response_id =
      options.previousResponseId;
  }

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(requestBody),
    },
  );

  const payload =
    (await response.json()) as OpenAIResponsePayload;

  if (!response.ok) {
    const openAIMessage =
      payload.error?.message ||
      "OpenAI could not generate a response.";

    throw new Error(
      `[Nous model: ${MODEL}] ${openAIMessage}`,
    );
  }

  const answer = extractOutputText(payload);

  if (!answer) {
    throw new Error(
      "Nous received an empty model response.",
    );
  }

  return {
    responseId: payload.id ?? null,

    answer,

    model: payload.model ?? MODEL,

    usage: {
      inputTokens:
        payload.usage?.input_tokens ?? 0,

      outputTokens:
        payload.usage?.output_tokens ?? 0,

      totalTokens:
        payload.usage?.total_tokens ?? 0,
    },
  };
}