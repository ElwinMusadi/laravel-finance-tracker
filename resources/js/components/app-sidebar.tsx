import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
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
} from "@/components/ui/sidebar"
import { IconDashboard, IconListDetails, IconChartBar, IconTags, IconFolder, IconUsers, IconCamera, IconFileDescription, IconFileAi, IconSettings, IconHelp, IconSearch, IconDatabase, IconReport, IconFileWord, IconInnerShadowTop } from "@tabler/icons-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dasbor",
      url: "/dashboard",
      icon: (
        <IconDashboard
        />
      ),
    },
    {
      title: "Akun",
      url: "/accounts",
      icon: (
        <IconListDetails
        />
      ),
    },
    {
      title: "Kategori",
      url: "/categories",
      icon: (
        <IconTags
        />
      ),
    },
    {
      title: "Kontak",      url: "/contacts",
      icon: (
        <IconUsers
        />
      ),
    },
    {
      title: "Transaksi",
      url: "/transactions",
      icon: (
        <IconChartBar
        />
      ),
    },
    {
      title: "Budget",
      url: "/budgets",
      icon: (
        <IconFolder
        />
      ),
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <IconCamera
        />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <IconFileDescription
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <IconFileAi
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Pengaturan",
      url: "#",
      icon: (
        <IconSettings
        />
      ),
    },
    {
      title: "Bantuan",
      url: "#",
      icon: (
        <IconHelp
        />
      ),
    },
    {
      title: "Cari",
      url: "#",
      icon: (
        <IconSearch
        />
      ),
    },
  ],
  documents: [
    {
      name: "Pustaka Data",
      url: "#",
      icon: (
        <IconDatabase
        />
      ),
    },
    {
      name: "Laporan",
      url: "#",
      icon: (
        <IconReport
        />
      ),
    },
    {
      name: "Asisten Word",
      url: "#",
      icon: (
        <IconFileWord
        />
      ),
    },
  ],
}

import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const page = usePage<{ auth?: Auth }>();
  const user = page.props.auth?.user;

  const currentUser = {
    name: user?.name ?? data.user.name,
    email: user?.email ?? data.user.email,
    avatar: user?.avatar ?? data.user.avatar,
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Finance Tracker</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
