import type {
  SupabaseClient,
} from "supabase";

import type {
  MembershipAccess,
  NousMode,
  OpenAIUsage,
} from "./types.ts";


type PlanCode =
  | "free"
  | "student"
  | "business"
  | "unlimited";


const dailyLimits:
  Record<
    PlanCode,
    number
  > = {

  free:
    10,

  student:
    56,

  business:
    140,

  unlimited:
    700,
};


/* =========================================================
   TESTERS
========================================================= */

function getTesterUserIds():
  Set<string> {

  const rawValue =
    Deno.env.get(
      "NOUS_TESTER_USER_IDS",
    ) || "";


  return new Set(
    rawValue
      .split(",")
      .map(
        (userId) =>
          userId.trim()
      )
      .filter(
        Boolean
      ),
  );
}


/* =========================================================
   DAILY USAGE
========================================================= */

async function countTodayUsage(
  adminClient:
    SupabaseClient,

  userId:
    string,
): Promise<number> {

  const startOfDay =
    new Date();


  startOfDay.setUTCHours(
    0,
    0,
    0,
    0,
  );


  const {
    count,
    error,
  } =
    await adminClient
      .from(
        "nous_usage"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
        },
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "request_status",
        "completed"
      )
      .gte(
        "created_at",
        startOfDay
          .toISOString()
      );


  if (error) {

    console.error(
      "Usage count error:",
      error,
    );


    throw new Error(
      "NOUS could not check the current usage allowance.",
    );
  }


  return count ?? 0;
}


/* =========================================================
   MEMBERSHIP
========================================================= */

async function resolveMembershipPlan(
  adminClient:
    SupabaseClient,

  userId:
    string,
): Promise<PlanCode> {

  /*
   * Approved team testers receive
   * Business allowance.
   */

  if (
    getTesterUserIds()
      .has(
        userId
      )
  ) {

    return "business";
  }


  const {
    data:
      membership,

    error:
      membershipError,
  } =
    await adminClient
      .from(
        "user_memberships"
      )
      .select(
        "*"
      )
      .eq(
        "user_id",
        userId
      )
      .in(
        "status",
        [
          "active",
          "trialing",
          "paid",
        ],
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        1
      )
      .maybeSingle();


  if (
    membershipError
  ) {

    console.warn(
      "Membership lookup failed; using NOUS Free:",
      membershipError,
    );


    return "free";
  }


  if (
    !membership
  ) {

    return "free";
  }


  const directCode =
    membership.plan_code ||
    membership.membership_code ||
    membership.code;


  if (
    directCode ===
      "free" ||
    directCode ===
      "student" ||
    directCode ===
      "business" ||
    directCode ===
      "unlimited"
  ) {

    return directCode;
  }


  if (
    directCode ===
    "student_beginner"
  ) {

    return "student";
  }


  if (
    directCode ===
    "business_education"
  ) {

    return "business";
  }


  if (
    directCode ===
    "nous_unlimited"
  ) {

    return "unlimited";
  }


  const planId =
    membership
      .membership_plan_id ||
    membership
      .plan_id;


  if (
    !planId
  ) {

    return "free";
  }


  const {
    data:
      plan,

    error:
      planError,
  } =
    await adminClient
      .from(
        "membership_plans"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        planId
      )
      .maybeSingle();


  if (
    planError ||
    !plan
  ) {

    console.warn(
      "Membership plan lookup failed; using NOUS Free:",
      planError,
    );


    return "free";
  }


  const planCode =
    plan.code ||
    plan.plan_code ||
    plan.slug;


  if (
    planCode ===
    "student_beginner"
  ) {

    return "student";
  }


  if (
    planCode ===
    "business_education"
  ) {

    return "business";
  }


  if (
    planCode ===
    "nous_unlimited"
  ) {

    return "unlimited";
  }


  if (
    planCode ===
      "free" ||
    planCode ===
      "student" ||
    planCode ===
      "business" ||
    planCode ===
      "unlimited"
  ) {

    return planCode;
  }


  return "free";
}


/* =========================================================
   ACCESS
========================================================= */

export async function checkNousAccess(
  adminClient:
    SupabaseClient,

  userId:
    string,
): Promise<MembershipAccess> {

  const planCode =
    await resolveMembershipPlan(
      adminClient,
      userId,
    );


  const dailyLimit =
    dailyLimits[
      planCode
    ];


  const usedToday =
    await countTodayUsage(
      adminClient,
      userId,
    );


  return {

    planCode,

    dailyLimit,

    usedToday,

    remainingToday:
      Math.max(
        dailyLimit -
          usedToday,
        0,
      ),

    allowed:
      usedToday <
      dailyLimit,

  };
}


/* =========================================================
   CONVERSATION MEMORY LOOKUP
========================================================= */

export async function getPreviousResponseId(
  adminClient:
    SupabaseClient,

  userId:
    string,

  conversationId?:
    string | null,
): Promise<
  string | null
> {

  /*
   * No conversation supplied means
   * this is the first turn.
   */

  if (
    !conversationId
  ) {

    return null;
  }


  const {
    data,
    error,
  } =
    await adminClient
      .from(
        "nous_conversations"
      )
      .select(
        "id, user_id, openai_response_id"
      )
      .eq(
        "id",
        conversationId
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Conversation lookup error:",
      error,
    );


    throw new Error(
      "NOUS could not verify this conversation.",
    );
  }


  /*
   * Important security boundary:
   *
   * A browser-supplied conversation ID
   * must belong to the authenticated user.
   */

  if (
    !data
  ) {

    throw new Error(
      "This NOUS conversation does not exist or does not belong to your account.",
    );
  }


  return (
    data
      .openai_response_id ??
    null
  );
}


/* =========================================================
   SAVE CONVERSATION TURN
========================================================= */

type SaveConversationOptions = {

  adminClient:
    SupabaseClient;

  userId:
    string;

  mode:
    NousMode;

  conversationId?:
    string | null;

  title?:
    string | null;

  sourceUrl?:
    string | null;

  message:
    string;

  answer:
    string;

  openAIResponseId?:
    string | null;

};


export async function saveConversation(
  options:
    SaveConversationOptions,
): Promise<string | null> {

  const {
    data,
    error,
  } =
    await options
      .adminClient
      .from(
        "nous_conversations"
      )
      .insert({

        user_id:
          options.userId,

        /*
         * Each turn points to the immediately
         * previous turn.
         *
         * The frontend then receives the new
         * row ID and uses that as the next
         * conversationId.
         */

        parent_conversation_id:
          options
            .conversationId ??
          null,

        mode:
          options.mode,

        title:
          options.title ??
          null,

        source_url:
          options.sourceUrl ??
          null,

        user_message:
          options.message,

        assistant_response:
          options.answer,

        openai_response_id:
          options
            .openAIResponseId ??
          null,

      })
      .select(
        "id"
      )
      .single();


  if (error) {

    console.error(
      "Conversation save error:",
      error,
    );


    return null;
  }


  return (
    data?.id ??
    null
  );
}


/* =========================================================
   SAVE USAGE
========================================================= */

type SaveUsageOptions = {

  adminClient:
    SupabaseClient;

  userId:
    string;

  mode:
    NousMode;

  model:
    string;

  usage:
    OpenAIUsage;

};


export async function saveUsage(
  options:
    SaveUsageOptions,
): Promise<void> {

  const {
    error,
  } =
    await options
      .adminClient
      .from(
        "nous_usage"
      )
      .insert({

        user_id:
          options.userId,

        service:
          options.mode,

        model:
          options.model,

        input_tokens:
          options
            .usage
            .inputTokens,

        output_tokens:
          options
            .usage
            .outputTokens,

        total_tokens:
          options
            .usage
            .totalTokens,

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