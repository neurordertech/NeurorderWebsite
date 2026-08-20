import { createClient } from "@supabase/supabase-js";

const YOCO_CHECKOUT_URL =
  "https://payments.yoco.com/api/checkouts";

/*
 * Approved university student email domains.
 *
 * Aster Private Academy has been removed.
 */
const STUDENT_EMAIL_DOMAINS = new Set([
  "myuct.ac.za",
  "myuwc.ac.za",
  "tuks.co.za",
  "student.uj.ac.za",
  "vossie.net",
  "mycput.ac.za",
]);

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
      "Student access with personal tools, education tools, calendar, notes, memory and basic AI.",
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
      "Business and Education access with enhanced AI, file uploads and additional memory.",
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
      "Complete access to Personal, Education and Business with priority AI and fair-use prompts.",
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

type PlanId =
  keyof typeof MEMBERSHIP_PLANS;

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

function getEmailDomain(
  email: string,
): string {
  const normalizedEmail =
    email.trim().toLowerCase();

  const separatorIndex =
    normalizedEmail.lastIndexOf("@");

  if (
    separatorIndex <= 0 ||
    separatorIndex ===
      normalizedEmail.length - 1
  ) {
    return "";
  }

  return normalizedEmail.slice(
    separatorIndex + 1,
  );
}

function isApprovedStudentEmail(
  email: string,
): boolean {
  const domain =
    getEmailDomain(email);

  return STUDENT_EMAIL_DOMAINS.has(
    domain,
  );
}

function getAllowedOrigin(
  request: Request,
): string {
  const requestOrigin =
    request.headers.get("origin") || "";

  const allowedOrigins = new Set([
    "https://neurorder.com",
    "https://www.neurorder.com",

    // Local development
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "http://localhost:8788",
    "http://127.0.0.1:8788",
  ]);

  /*
   * Allows terminal and server-to-server
   * requests without an Origin header.
   */
  if (!requestOrigin) {
    return "https://neurorder.com";
  }

  if (
    allowedOrigins.has(
      requestOrigin,
    )
  ) {
    return requestOrigin;
  }

  console.warn(
    "Blocked checkout origin:",
    requestOrigin,
  );

  return "";
}

function createCorsHeaders(
  origin: string,
): HeadersInit {
  return {
    "Access-Control-Allow-Origin":
      origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "POST, OPTIONS",
    "Content-Type":
      "application/json",
    "Vary":
      "Origin",
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
      headers:
        createCorsHeaders(origin),
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
     * Browser CORS preflight.
     */
    if (
      request.method === "OPTIONS"
    ) {
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

    if (
      request.method !== "POST"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Method not allowed.",
        },
        405,
        origin ||
          "https://neurorder.com",
      );
    }

    if (!origin) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Origin not allowed.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    try {
      /*
       * Server-side environment variables.
       */
      const yocoSecretKey =
        Deno.env.get(
          "YOCO_SECRET_KEY",
        );

      const siteUrl =
        Deno.env.get(
          "SITE_URL",
        );

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL",
        );

      const supabaseAnonKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY",
        );

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
       * Require a signed-in Supabase user.
       */
      const authorizationHeader =
        request.headers.get(
          "Authorization",
        );

      if (
        !authorizationHeader ||
        !authorizationHeader.startsWith(
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
       * Read the selected plan.
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
       * Student plan protection.
       *
       * Only users with a confirmed email
       * from an approved university domain
       * may create the R39 checkout.
       */
      if (
        planId ===
        "nous_student_monthly"
      ) {
        const userEmail =
          user.email
            ?.trim()
            .toLowerCase() || "";

        if (!userEmail) {
          return jsonResponse(
            {
              success: false,
              error:
                "A university email address is required for the Nous Student plan.",
            },
            403,
            origin,
          );
        }

        if (
          !isApprovedStudentEmail(
            userEmail,
          )
        ) {
          return jsonResponse(
            {
              success: false,
              error:
                "The Nous Student plan is available only to students using an approved university email address.",
            },
            403,
            origin,
          );
        }

        if (
          !user.email_confirmed_at
        ) {
          return jsonResponse(
            {
              success: false,
              error:
                "Confirm your university email address before selecting the Nous Student plan.",
            },
            403,
            origin,
          );
        }
      }

      /*
       * Create a unique internal reference.
       */
      const checkoutReference =
        createReference();

      const normalizedSiteUrl =
        siteUrl.replace(
          /\/+$/,
          "",
        );

      const promptAccess =
        selectedPlan
          .monthlyPromptLimit === null
          ? "fair_use"
          : String(
              selectedPlan
                .monthlyPromptLimit,
            );

      const yocoPayload = {
        amount:
          selectedPlan.amount,

        currency:
          "ZAR",

        successUrl:
          `${normalizedSiteUrl}/payment-success.html` +
          `?reference=${encodeURIComponent(
            checkoutReference,
          )}`,

        cancelUrl:
          `${normalizedSiteUrl}/payment-cancelled.html` +
          `?reference=${encodeURIComponent(
            checkoutReference,
          )}`,

        failureUrl:
          `${normalizedSiteUrl}/payment-failed.html` +
          `?reference=${encodeURIComponent(
            checkoutReference,
          )}`,

        metadata: {
          reference:
            checkoutReference,

          userId:
            user.id,

          userEmail:
            user.email || "",

          planId,

          planName:
            selectedPlan.name,

          accessLevel:
            selectedPlan.accessLevel,

          durationMonths:
            String(
              selectedPlan
                .durationMonths,
            ),

          monthlyPromptLimit:
            promptAccess,

          dashboards:
            selectedPlan.dashboards.join(
              ",",
            ),

          provider:
            "yoco",
        },

        lineItems: [
          {
            displayName:
              selectedPlan.name,

            description:
              selectedPlan.description,

            quantity:
              1,

            pricingDetails: {
              price:
                selectedPlan.amount,
            },
          },
        ],
      };

      /*
       * Create the Yoco checkout.
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
          {
            status:
              yocoResponse.status,
          },
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
              yocoData.description ||
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
          yocoData,
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
       * Return safe checkout details.
       */
      return jsonResponse(
        {
          success: true,

          provider:
            "yoco",

          checkoutId:
            yocoData.id,

          checkoutUrl:
            yocoData.redirectUrl,

          reference:
            checkoutReference,

          plan: {
            id:
              planId,

            name:
              selectedPlan.name,

            amount:
              selectedPlan.amount,

            currency:
              "ZAR",

            accessLevel:
              selectedPlan.accessLevel,

            durationMonths:
              selectedPlan
                .durationMonths,

            monthlyPromptLimit:
              selectedPlan
                .monthlyPromptLimit,

            dashboards:
              selectedPlan
                .dashboards,
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