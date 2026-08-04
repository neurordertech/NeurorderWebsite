(() => {
  "use strict";

  const configured = window.NOUS_SUPABASE_CONFIG || {};
  const url = configured.url || "YOUR_SUPABASE_PROJECT_URL";
  const publishableKey =
    configured.publishableKey ||
    configured.anonKey ||
    "YOUR_SUPABASE_ANON_KEY";

  window.NOUS_SUPABASE_CONFIG = Object.freeze({
    url,
    publishableKey
  });

  const hasRealConfiguration =
    /^https:\/\/.+\.supabase\.co$/i.test(url) &&
    publishableKey &&
    !publishableKey.startsWith("YOUR_");

  window.NOUS_CONFIG_READY = hasRealConfiguration;

  if (!hasRealConfiguration) {
    console.error(
      "[NOUS] Add the project URL and public anon/publishable key in js/supabase-config.js."
    );
    return;
  }

  if (!window.supabase?.createClient) {
    console.error("[NOUS] Supabase JS must load before supabase-config.js.");
    return;
  }

  if (!window.NOUS_SUPABASE) {
    window.NOUS_SUPABASE = window.supabase.createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
})();
