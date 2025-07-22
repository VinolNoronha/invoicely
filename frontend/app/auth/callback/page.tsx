"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      console.log(data);
      if (data.user) {
        router.push(`/dashboard/${data?.user?.id}`);
      } else {
        router.push("/");
      }
    });
  }, []);

  return <p>Signing you in...</p>;
}
