import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import { useTransactionModal } from "@/hooks/use-transaction-modal";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
  }[];
}) {
  const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
  const { openModal } = useTransactionModal();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Catat Transaksi"
              className="min-w-8 bg-primary text-primary-foreground font-medium duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground shadow-xs active:scale-[0.98]"
              onClick={openModal}
            >
              <IconCirclePlusFilled className="size-4" />
              <span>Catat Transaksi</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              isCurrentUrl(item.url) || isCurrentOrParentUrl(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  asChild
                  className={
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold hover:bg-accent hover:text-accent-foreground data-active:bg-accent data-active:text-accent-foreground shadow-2xs"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
