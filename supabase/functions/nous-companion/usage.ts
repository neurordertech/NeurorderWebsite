import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  MembershipAccess,
  NousMode,
  OpenAIUsage,
} from "./types.ts";

const temporaryDailyLimits = {
  free: 5,
  student: 40,
  business: 100,
  unlimited: 500,
} as const;

async function countTodayUsage(
  adminClient: SupabaseClient,
  userId: string,
): Promise<number> {
  const startOfDay = new Date();

  startOfDay.setUTCHours(
    0,
    0,
    0,
    0,
  );

  const {
    count,
    error,
  } = await adminClient
    .from("nous_usage")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq(
      "request_status",
      "completed",
    )
    .gte(
      "created_at",
      startOfDay.toISOString(),
    );

  if (error) {
    console.error(
      "Usage count error:",
      error,
    );

    throw new Error(
      "Nous could not check the current usage allowance.",
    );
  }

  return count ?? 0;
}

export async function checkNousAccess(
  adminClient: SupabaseClient,
  userId: string,
): Promise<MembershipAccess> {
  const planCode = "free";

  const dailyLimit =
    temporaryDailyLimits[planCode];

  const usedToday =
    await countTodayUsage(
      adminClient,
      userId,
    );

  return {
    planCode,
    dailyLimit,
    usedToday,

    remainingToday: Math.max(
      dailyLimit - usedToday,
      0,
    ),

    allowed:
      usedToday < dailyLimit,
  };
}

type SaveConversationOptions = {
  adminClient: SupabaseClient;
  userId: string;
  mode: NousMode;
  conversationId?: string | null;
  title?: string | null;
  sourceUrl?: string | null;
  message: string;
  answer: string;
  openAIResponseId?: string | null;
};

export async function saveConversation(
  options: SaveConversationOptions,
): Promise<string | null> {
  const {
    data,
    error,
  } = await options.adminClient
    .from("nous_conversations")
    .insert({
      user_id:
        options.userId,

      parent_conversation_id:
        options.conversationId ?? null,

      mode:
        options.mode,

      title:
        options.title ?? null,

      source_url:
        options.sourceUrl ?? null,

      user_message:
        options.message,

      assistant_response:
        options.answer,

      openai_response_id:
        options.openAIResponseId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(
      "Conversation save error:",
      error,
    );

    return null;
  }

  return data?.id ?? null;
}

type SaveUsageOptions = {
  adminClient: SupabaseClient;
  userId: string;
  mode: NousMode;
  model: string;
  usage: OpenAIUsage;
};

export async function saveUsage(
  options: SaveUsageOptions,
): Promise<void> {
  const {
    error,
  } = await options.adminClient
    .from("nous_usage")
    .insert({
      user_id:
        options.userId,

      service:
        options.mode,

      model:
        options.model,

      input_tokens:
        options.usage.inputTokens,

      output_tokens:
        options.usage.outputTokens,

      total_tokens:
        options.usage.totalTokens,

      request_status:
        "completed",
    });

  if (error) {
    console.error(
      "Usage save error:",
      error,
    );
  }
}