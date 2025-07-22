"use client";

import { createClient } from "@/lib/supabase/client";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";

export default function SidebarFooterActions() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Redirect first then refresh to avoid flash of authenticated content
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      // Consider adding toast notification here
    }
  }

  return (
    <>
      <DropdownMenuItem>
        <span className="w-full text-left py-1.5 cursor-pointer hover:bg-gray-100 transition rounded-md">
          Account
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <button
          onClick={handleLogOut}
          className="w-full text-left py-1.5 cursor-pointer hover:bg-gray-100 transition rounded-md"
        >
          Sign out
        </button>
      </DropdownMenuItem>
    </>
  );
}
