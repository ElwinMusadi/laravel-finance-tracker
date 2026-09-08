import { Link } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCurrentUrl } from "@/hooks/use-current-url"
import { IconCirclePlusFilled } from "@tabler/icons-react"
import { useTransactionModal } from "@/hooks/use-transaction-modal"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl()
  const { openModal } = useTransactionModal()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Add Transaction"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={openModal}
            >
              <IconCirclePlusFilled />
              <span>Add Transaction</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isCurrentUrl(item.url) || isCurrentOrParentUrl(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  asChild
                  className={isActive ? "bg-primary text-primary-foreground data-active:bg-primary data-active:text-primary-foreground font-medium shadow-xs hover:bg-primary/90 hover:text-primary-foreground data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground" : ""}
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
