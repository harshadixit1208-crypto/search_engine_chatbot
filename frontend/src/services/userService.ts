import { supabase } from "../lib/supabase";
import type { User as AuthUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  name: string;
  provider: "Google" | "Github";
  createdAt: string;
  updatedAt: string;
}

/**
 * Create or update user in database after OAuth login
 */
export async function createOrUpdateUser(authUser: AuthUser): Promise<User | null> {
  if (!authUser.email) {
    console.error("User email not available");
    return null;
  }

  // Determine provider from identities
  const identity = authUser.identities?.[0];
  let provider: "Google" | "Github" = "Google";
  
  if (identity?.provider === "github") {
    provider = "Github";
  } else if (identity?.provider === "google") {
    provider = "Google";
  }

  const userData = {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
    provider,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Upsert user (create if not exists, update if exists)
    const { data, error } = await supabase
      .from("User")
      .upsert([userData], { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error upserting user:", error);
      return null;
    }

    return data as User;
  } catch (err) {
    console.error("Error in createOrUpdateUser:", err);
    return null;
  }
}

/**
 * Get user from database
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("User")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return data as User;
  } catch (err) {
    console.error("Error in getUser:", err);
    return null;
  }
}
