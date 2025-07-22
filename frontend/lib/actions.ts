"use server";

import { redirect } from "next/navigation";
import { createClientServer } from "./supabase/server";

export async function signInWithGoogle() {
  const supabase = await createClientServer();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`, // must match what’s in Supabase
    },
  });

  if (error) {
    console.error("Google Sign-In Error:", error);
    return;
  }

  // Redirect to Google's OAuth screen
  redirect(data.url!);
}
