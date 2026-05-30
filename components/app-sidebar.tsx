"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpenIcon,
  BrainIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

import { signOutAction } from "@/app/(actions)/actions/auth/auth"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Panel",
      url: "/admin",
      icon: LayoutDashboardIcon,
      items: [
        {
          title: "Genel bakis",
          url: "/admin",
        },
        {
          title: "Yayin akisi",
          url: "/admin/publishing",
        },
      ],
    },
    {
      title: "Icerik",
      url: "/admin/content",
      icon: BookOpenIcon,
      items: [
        {
          title: "Donemler",
          url: "/admin/periods",
        },
        {
          title: "Konular",
          url: "/admin/topics",
        },
        {
          title: "Tarihsel varliklar",
          url: "/admin/entities",
        },
      ],
    },
    {
      title: "Bilgi kartlari",
      url: "/admin/flashcards",
      icon: BrainIcon,
      items: [],
    },
    {
      title: "Harita",
      url: "/admin/maps",
      icon: MapIcon,
      items: [
        {
          title: "Katmanlar",
          url: "/admin/map-layers",
        },
        {
          title: "Olaylar",
          url: "/admin/events",
        },
        {
          title: "Konumlar",
          url: "/admin/event-locations",
        },
      ],
    },
    {
      title: "Ogrenme",
      url: "/admin/learning",
      icon: BrainIcon,
      items: [
        {
          title: "Test sorulari",
          url: "/admin/questions",
        },
        {
          title: "Secenekler",
          url: "/admin/options",
        },
      ],
    },
    {
      title: "Kullanicilar",
      url: "/admin/users",
      icon: UsersIcon,
      items: [
        {
          title: "Profiller",
          url: "/admin/users",
        },
        {
          title: "Roller",
          url: "/admin/roles",
        },
      ],
    },
    {
      title: "Ayarlar",
      url: "/admin/settings",
      icon: SettingsIcon,
      items: [
        {
          title: "Genel",
          url: "/admin/settings",
        },
      ],
    },
  ],
}

export function AppSidebar({
  userEmail,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userEmail?: string | null
}) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">KPSS Tarih</span>
                  <span>Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Yonetim</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link href={item.url} className="font-medium">
                    <item.icon />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
              {userEmail ?? "Admin"}
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <LogOutIcon />
                Cikis yap
              </Button>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
