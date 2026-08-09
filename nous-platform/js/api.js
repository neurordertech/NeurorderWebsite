/*
 * NOUS API
 * ----------------------------------------
 * Handles communication with the deployed
 * O.R.U.L.E. Edge Function.
 */

const ORULE_ENDPOINT =
  "https://ixnncxwrztxluiltmsol.supabase.co/functions/v1/orule";

/**
 * Send a prompt to O.R.U.L.E.
 *
 * @param {string} message
 * @param {string} accessToken
 * @returns {Promise<Object>}
 */
export async function askOrule(
  message,
  accessToken,
) {
  const response = await fetch(
    ORULE_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `O.R.U.L.E. returned ${response.status}`,
    );
  }

  return await response.json();
}