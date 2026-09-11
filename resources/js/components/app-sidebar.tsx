import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    IconDashboard,
    IconListDetails,
    IconChartBar,
    IconTags,
    IconFolder,
    IconUsers,
    IconSettings,
    IconWallet,
} from '@tabler/icons-react';
import type { Auth } from '@/types';

const navigationItems = {
    navMain: [
        {
            title: 'Dasbor',
            url: '/dashboard',
            icon: <IconDashboard className="size-4" />,
        },
        {
            title: 'Transaksi',
            url: '/transactions',
            icon: <IconChartBar className="size-4" />,
        },
        {
            title: 'Akun',
            url: '/accounts',
            icon: <IconListDetails className="size-4" />,
        },
        {
            title: 'Budget',
            url: '/budgets',
            icon: <IconFolder className="size-4" />,
        },
        {
            title: 'Kategori',
            url: '/categories',
            icon: <IconTags className="size-4" />,
        },
        {
            title: 'Kontak',
            url: '/contacts',
            icon: <IconUsers className="size-4" />,
        },
    ],
    navSecondary: [
        {
            title: 'Pengaturan',
            url: '/settings/profile',
            icon: <IconSettings className="size-4" />,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const page = usePage<{ auth?: Auth }>();
    const user = page.props.auth?.user;

    const currentUser = {
        name: user?.name ?? 'Pengguna',
        username: user?.username ?? '',
        avatar: user?.avatar ?? '',
    };

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            className="data-[slot=sidebar-menu-button]:p-2"
                        >
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3"
                            >
                                <div className="bg-primary text-primary-foreground flex aspect-square size-9 items-center justify-center rounded-lg shadow-xs">
                                    <IconWallet className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold tracking-tight">
                                        Finance Tracker
                                    </span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        Personal Ledger
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navigationItems.navMain} />
                <NavSecondary
                    items={navigationItems.navSecondary}
                    className="mt-auto"
                />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={currentUser} />
            </SidebarFooter>
        </Sidebar>
    );
}
