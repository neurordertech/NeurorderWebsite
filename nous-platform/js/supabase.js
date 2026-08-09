import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.NOUS_SUPABASE_CONFIG;

export const supabase = createClient(
  config.url,
  config.publishableKey,
);