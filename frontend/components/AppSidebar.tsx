import {
  Calendar,
  ChevronUp,
  Home,
  IndianRupee,
  StickyNote,
  User2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

import { Fjalla_One } from "next/font/google";
import Logo from "@/public/invoicelylogo.png";
import Image from "next/image";
import SidebarFooterActions from "./sidebar-footer-act";
import { Suspense } from "react";

// Menu items.
const items = [
  {
    title: "Home",
    url: `home`,
    icon: Home,
  },
  {
    title: "Invoices",
    url: `invoices`,
    icon: StickyNote,
  },
  {
    title: "GST",
    url: `gst`,
    icon: IndianRupee,
  },
];

const fjalla_one = Fjalla_One({
  weight: "400",
  subsets: ["latin"],
});

interface UserMetadata {
  full_name: string;
  email: string;
  picture: string;
}

interface AppSidebarProps {
  user: {
    id: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
      email?: string;
    };
  } | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarHeader className="h-15 flex justify-center">
          <div className="flex flex-row justify-start items-center gap-2 w-full">
            <Image
              className="rounded-md flex-none"
              height={30}
              width={30}
              alt="logo"
              src={Logo}
            />
            <h1
              className={`${fjalla_one.className} text-2xl w-64 flex-1 text-black`}
            >
              Invoicely
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={`/dashboard/${user?.id}/${item.url}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className="flex flex-row w-full gap-1.5">
                    <div className="relative h-8 w-10 rounded-lg overflow-hidden">
                      {user?.user_metadata?.avatar_url ? (
                        <Image
                          src={user?.user_metadata?.avatar_url}
                          alt="User avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User2 className="text-gray-500 h-6 w-6" />
                      )}
                    </div>
                    <div className="flex flex-col items-start w-full  bg-amber-40">
                      <span className="text-sm font-semibold">{`${user?.user_metadata?.full_name}`}</span>
                      <span className="text-[9px] font-semibold">{`${user?.user_metadata?.email}`}</span>
                    </div>
                  </div>

                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] "
              >
                <Suspense fallback={<div className="py-1.5">Loading...</div>}>
                  <SidebarFooterActions />
                </Suspense>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
