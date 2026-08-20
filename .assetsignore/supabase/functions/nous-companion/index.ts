import {
  createNousClients,
  getAuthenticatedUser,
} from "./auth.ts";

import {
  buildModelInput,
  routeNousRequest,
} from "./orule.ts";

import {
  generateNousResponse,
} from "./openai.ts";

import {
  checkNousAccess,
  saveConversation,
  saveUsage,
} from "./usage.ts";

import type {
  NousRequestBody,
} from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json",
      },
    },
  );
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          error:
            "Method not allowed.",
        },
        405,
      );
    }

    try {
      const openAIKey =
        Deno.env.get(
          "OPENAI_API_KEY",
        );

      if (!openAIKey) {
        throw new Error(
          "OPENAI_API_KEY has not been configured.",
        );
      }

      const authorization =
        request.headers.get(
          "Authorization",
        ) || "";

      const {
        userClient,
        adminClient,
      } =
        createNousClients(
          authorization,
        );

      const user =
        await getAuthenticatedUser(
          userClient,
        );

      /*
       * Phase 1 requires a signed-in user.
       * This protects API expenditure.
       */
      if (!user) {
        return jsonResponse(
          {
            error:
              "Please sign in to use Nous Companion.",

            code:
              "AUTH_REQUIRED",
          },
          401,
        );
      }

      let body:
        NousRequestBody;

      try {
        body =
          await request.json() as
            NousRequestBody;
      } catch {
        return jsonResponse(
          {
            error:
              "The request body is not valid JSON.",
          },
          400,
        );
      }

      const message =
        body.message?.trim() ||
        "";

      if (!message) {
        return jsonResponse(
          {
            error:
              "Please enter a message for Nous.",
          },
          400,
        );
      }

      if (
        message.length >
        2000
      ) {
        return jsonResponse(
          {
            error:
              "Your message is too long. Please shorten it.",
          },
          400,
        );
      }

      const route =
        routeNousRequest(
          body.mode,
          body.context || null,
        );

      const access =
        await checkNousAccess(
          adminClient,
          user.id,
        );

      if (!access.allowed) {
        return jsonResponse(
          {
            error:
              "You have reached today’s Nous usage allowance.",

            code:
              "USAGE_LIMIT_REACHED",

            upgradeRequired:
              true,

            access,
          },
          429,
        );
      }

      const modelInput =
        buildModelInput(
          message,
          route,
        );

      /*
       * We will enable previous_response_id
       * after the database confirms that the
       * supplied conversation belongs to the user.
       */
      const modelResult =
        await generateNousResponse({
          apiKey:
            openAIKey,

          instructions:
            route.instructions,

          input:
            modelInput,
        });

      const conversationId =
        await saveConversation({
          adminClient,
          userId:
            user.id,

          mode:
            route.mode,

          conversationId:
            body.conversationId,

          title:
            body.context
              ?.title ||
            null,

          sourceUrl:
            body.context
              ?.url ||
            null,

          message,

          answer:
            modelResult.answer,

          openAIResponseId:
            modelResult.responseId,
        });

      await saveUsage({
        adminClient,
        userId:
          user.id,

        mode:
          route.mode,

        model:
          modelResult.model,

        usage:
          modelResult.usage,
      });

      return jsonResponse({
        answer:
          modelResult.answer,

        mode:
          route.mode,

        conversationId,

        signedIn: true,

        access: {
          planCode:
            access.planCode,

          dailyLimit:
            access.dailyLimit,

          usedToday:
            access.usedToday +
            1,

          remainingToday:
            Math.max(
              access.remainingToday -
                1,
              0,
            ),
        },

        usage:
          modelResult.usage,
      });
    } catch (error) {
      console.error(
        "Nous Companion error:",
        error,
      );

      return jsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "An unexpected Nous error occurred.",
        },
        500,
      );
    }
  },
);