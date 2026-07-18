import { createClient } from "@supabase/supabase-js";

const YOCO_CHECKOUT_URL =
  "https://payments.yoco.com/api/checkouts";

/*
 * All prices are stored in cents:
 *
 * 3900  = R39.00
 * 8900  = R89.00
 * 16900 = R169.00
 *
 * The Free plan costs R0 and does not use Yoco.
 */
const MEMBERSHIP_PLANS = {
  nous_student_monthly: {
    name: "Nous Student",
    description:
      "Student and beginner-friendly access with personal tools, calendar, notes, memory and basic AI",
    amount: 3900,
    durationMonths: 1,
    accessLevel: "student",
    monthlyPromptLimit: 150,
    dashboards: [
      "personal",
      "education",
    ],
  },

  nous_professional_monthly: {
    name: "Nous Professional",
    description:
      "Business and Education access with better AI, file uploads and additional memory",
    amount: 8900,
    durationMonths: 1,
    accessLevel: "professional",
    monthlyPromptLimit: 500,
    dashboards: [
      "personal",
      "business",
      "education",
    ],
  },

  nous_unlimited_monthly: {
    name: "Nous Unlimited",
    description:
      "Complete access to Personal, Education and Business with priority AI and fair-use prompts",
    amount: 16900,
    durationMonths: 1,
    accessLevel: "unlimited",
    monthlyPromptLimit: null,
    dashboards: [
      "personal",
      "business",
      "education",
    ],
  },
} as const;

type PlanId = keyof typeof MEMBERSHIP_PLANS;

type CheckoutRequest = {
  planId?: string;
};

type YocoCheckoutResponse = {
  id?: string;
  status?: string;
  redirectUrl?: string;
  amount?: number;
  currency?: string;
  errorType?: string;
  errorCode?: string;
  description?: string;
};

function isValidPlanId(
  planId: string,
): planId is PlanId {
  return Object.prototype.hasOwnProperty.call(
    MEMBERSHIP_PLANS,
    planId,
  );
}

function getAllowedOrigin(request: Request): string {
  const requestOrigin =
    request.headers.get("origin");

  const configuredSiteUrl =
    Deno.env.get("SITE_URL");

  if (!configuredSiteUrl) {
    return "";
  }

  try {
    const allowedOrigin =
      new URL(configuredSiteUrl).origin;

    if (requestOrigin === allowedOrigin) {
      return allowedOrigin;
    }

    /*
     * Allows terminal and server-to-server testing
     * where the Origin header is absent.
     */
    if (!requestOrigin) {
      return allowedOrigin;
    }

    return "";
  } catch {
    console.error(
      "SITE_URL is not a valid URL.",
    );

    return "";
  }
}

function createCorsHeaders(
  origin: string,
): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: createCorsHeaders(origin),
    },
  );
}

function createReference(): string {
  return crypto.randomUUID();
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    const origin =
      getAllowedOrigin(request);

    /*
     * Handle the browser's CORS preflight request.
     */
    if (request.method === "OPTIONS") {
      if (!origin) {
        return new Response(
          null,
          {
            status: 403,
          },
        );
      }

      return new Response(
        null,
        {
          status: 204,
          headers:
            createCorsHeaders(origin),
        },
      );
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed.",
        },
        405,
        origin,
      );
    }

    if (!origin) {
      return jsonResponse(
        {
          success: false,
          error: "Origin not allowed.",
        },
        403,
        "",
      );
    }

    try {
      /*
       * 1. Read the required server-side
       * environment variables.
       */
      const yocoSecretKey =
        Deno.env.get("YOCO_SECRET_KEY");

      const siteUrl =
        Deno.env.get("SITE_URL");

      const supabaseUrl =
        Deno.env.get("SUPABASE_URL");

      const supabaseAnonKey =
        Deno.env.get("SUPABASE_ANON_KEY");

      if (!yocoSecretKey) {
        console.error(
          "YOCO_SECRET_KEY is missing.",
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Payment service is not configured.",
          },
          500,
          origin,
        );
      }

      if (!siteUrl) {
        console.error(
          "SITE_URL is missing.",
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Website URL is not configured.",
          },
          500,
          origin,
        );
      }

      if (
        !supabaseUrl ||
        !supabaseAnonKey
      ) {
        console.error(
          "Supabase environment variables are missing.",
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Authentication service is not configured.",
          },
          500,
          origin,
        );
      }

      /*
       * 2. Require a valid signed-in
       * Supabase user.
       */
      const authorizationHeader =
        request.headers.get(
          "Authorization",
        );

      if (
        !authorizationHeader?.startsWith(
          "Bearer ",
        )
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "You must be signed in before subscribing.",
          },
          401,
          origin,
        );
      }

      const supabase =
        createClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            global: {
              headers: {
                Authorization:
                  authorizationHeader,
              },
            },

            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        );

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        console.error(
          "Authentication failed:",
          userError?.message,
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Your session is invalid or has expired.",
          },
          401,
          origin,
        );
      }

      /*
       * 3. Read and validate the selected
       * membership plan.
       *
       * The frontend sends only the plan ID.
       * It cannot control the price.
       */
      let requestBody:
        CheckoutRequest;

      try {
        requestBody =
          await request.json();
      } catch {
        return jsonResponse(
          {
            success: false,
            error:
              "The request body must contain valid JSON.",
          },
          400,
          origin,
        );
      }

      const requestedPlanId =
        requestBody.planId;

      if (
        typeof requestedPlanId !==
          "string" ||
        !isValidPlanId(
          requestedPlanId,
        )
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Invalid membership plan.",
          },
          400,
          origin,
        );
      }

      const planId: PlanId =
        requestedPlanId;

      const selectedPlan =
        MEMBERSHIP_PLANS[planId];

      /*
       * 4. Create a unique internal
       * checkout reference.
       *
       * This will later connect:
       *
       * Yoco checkout
       * -> payment record
       * -> Supabase user
       * -> membership
       */
      const checkoutReference =
        createReference();

      const normalizedSiteUrl =
        siteUrl.replace(/\/+$/, "");

      const promptAccess =
        selectedPlan
          .monthlyPromptLimit === null
          ? "fair_use"
          : selectedPlan
              .monthlyPromptLimit;

      const yocoPayload = {
        amount: selectedPlan.amount,
        currency: "ZAR",

        successUrl:
          `${normalizedSiteUrl}/payment-success.html` +
          `?reference=${checkoutReference}`,

        cancelUrl:
          `${normalizedSiteUrl}/payment-cancelled.html` +
          `?reference=${checkoutReference}`,

        failureUrl:
          `${normalizedSiteUrl}/payment-failed.html` +
          `?reference=${checkoutReference}`,

        metadata: {
          reference:
            checkoutReference,
          userId: user.id,
          planId,
          planName:
            selectedPlan.name,
          accessLevel:
            selectedPlan.accessLevel,
          durationMonths:
            selectedPlan.durationMonths,
          monthlyPromptLimit:
            promptAccess,
          dashboards:
            selectedPlan.dashboards.join(
              ",",
            ),
          provider: "yoco",
        },

        lineItems: [
          {
            displayName:
              selectedPlan.name,
            description:
              selectedPlan.description,
            quantity: 1,

            pricingDetails: {
              price:
                selectedPlan.amount,
            },
          },
        ],
      };

      /*
       * 5. Create the Yoco
       * checkout session.
       */
      const yocoResponse =
        await fetch(
          YOCO_CHECKOUT_URL,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${yocoSecretKey}`,
              "Content-Type":
                "application/json",
              "Idempotency-Key":
                checkoutReference,
            },

            body:
              JSON.stringify(
                yocoPayload,
              ),
          },
        );

      let yocoData:
        YocoCheckoutResponse;

      try {
        yocoData =
          await yocoResponse.json();
      } catch {
        console.error(
          "Yoco returned a non-JSON response.",
          yocoResponse.status,
        );

        return jsonResponse(
          {
            success: false,
            error:
              "The payment provider returned an invalid response.",
          },
          502,
          origin,
        );
      }

      if (!yocoResponse.ok) {
        console.error(
          "Yoco checkout creation failed:",
          {
            status:
              yocoResponse.status,
            errorType:
              yocoData.errorType,
            errorCode:
              yocoData.errorCode,
            description:
              yocoData.description,
          },
        );

        return jsonResponse(
          {
            success: false,
            error:
              "The checkout session could not be created.",
            providerCode:
              yocoData.errorCode ??
              null,
          },
          502,
          origin,
        );
      }

      if (
        !yocoData.id ||
        !yocoData.redirectUrl
      ) {
        console.error(
          "Yoco response is missing checkout information.",
        );

        return jsonResponse(
          {
            success: false,
            error:
              "The payment provider returned incomplete checkout information.",
          },
          502,
          origin,
        );
      }

      /*
       * 6. Return only safe information
       * to the browser.
       */
      return jsonResponse(
        {
          success: true,
          provider: "yoco",
          checkoutId:
            yocoData.id,
          checkoutUrl:
            yocoData.redirectUrl,
          reference:
            checkoutReference,

          plan: {
            id: planId,
            name:
              selectedPlan.name,
            amount:
              selectedPlan.amount,
            currency: "ZAR",
            accessLevel:
              selectedPlan.accessLevel,
            durationMonths:
              selectedPlan.durationMonths,
            monthlyPromptLimit:
              selectedPlan
                .monthlyPromptLimit,
            dashboards:
              selectedPlan.dashboards,
          },
        },
        200,
        origin,
      );
    } catch (error) {
      console.error(
        "Unexpected checkout error:",
        error instanceof Error
          ? error.message
          : error,
      );

      return jsonResponse(
        {
          success: false,
          error:
            "An unexpected checkout error occurred.",
        },
        500,
        origin,
      );
    }
  },
);