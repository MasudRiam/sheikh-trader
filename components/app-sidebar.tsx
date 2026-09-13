"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  PackageIcon,
  BookUserIcon,
  WalletIcon,
  LandmarkIcon,
  ChartColumnIcon,
  Settings2Icon,
  StoreIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Sheikh Trader",
    email: "shop@sheikhtrader.local",
    avatar: "/icon.png",
  },
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Bikri (Sales)", url: "/sales", icon: <ShoppingCartIcon /> },
    { title: "Products / Stock", url: "/products", icon: <PackageIcon /> },
    { title: "Baki / Due", url: "/due", icon: <BookUserIcon /> },
    { title: "Expenses", url: "/expenses", icon: <WalletIcon /> },
    { title: "Accounts", url: "/accounts", icon: <LandmarkIcon /> },
    { title: "Reports", url: "/reports", icon: <ChartColumnIcon /> },
  ],
  navSecondary: [
    { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              onClick={() => setOpenMobile(false)}
              render={<Link href="/dashboard" />}
            >
              <StoreIcon className="size-5!" />
              <span className="text-base font-semibold">Sheikh Trader</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
