import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type {
  AuthenticatedUser,
} from "./types.ts";

type NousClients = {
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
};

export function createNousClients(
  authorizationHeader: string,
): NousClients {
  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const supabaseAnonKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    );

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Required Supabase environment variables are missing.",
    );
  }

  const userClient =
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
      },
    );

  const adminClient =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

  return {
    userClient,
    adminClient,
  };
}

export async function getAuthenticatedUser(
  userClient: SupabaseClient,
): Promise<AuthenticatedUser | null> {
  const {
    data,
    error,
  } =
    await userClient.auth
      .getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email:
      data.user.email,
  };
}