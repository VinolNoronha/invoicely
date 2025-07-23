"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { SidebarTrigger } from "./ui/sidebar";

export default function DynamicRoute() {
  const pathName = usePathname(); //gets the current path EG: dashboard/id/gst
  const segments = pathName.split("/");
  const currentPath = segments[segments.length - 1];

  return (
    <>
      <SidebarTrigger />
      <span>|</span>
      <span className="ml-2 text-base">{currentPath || "-"}</span>
    </>
  );
}
