"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Logo from "@/components/logo"
import { useAppStore } from "@/store/app-store"
import { LayoutDashboard, FileText, LifeBuoy } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = {
  employee: [
    { href: "/dashboard/employee", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/employee/reports", label: "Reports", icon: FileText },
  ],
  hod: [
    { href: "/dashboard/hod", label: "Dashboard", icon: LayoutDashboard },
  ],
  finance: [
    { href: "/dashboard/finance", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/finance/payments", label: "Payments", icon: FileText },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: FileText },
  ],
}

export default function MainSidebar() {
  const currentUser = useAppStore((state) => state.currentUser)
  const pathname = usePathname()

  if (!currentUser) return null

  const currentNavItems = navItems[currentUser.role] || []

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
            <Logo size="sm" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  icon={<item.icon />}
                  tooltip={item.label}
                  className="relative"
                >
                  {item.label}
                   {pathname === item.href && (
                    <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton icon={<LifeBuoy/>}>Help & Support</SidebarMenuButton>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
