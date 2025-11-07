
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
import { LayoutDashboard, LifeBuoy, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = {
  employee: [
    { href: "/dashboard/employee", label: "Dashboard", icon: LayoutDashboard },
  ],
  hod: [
    { href: "/dashboard/hod", label: "Dashboard", icon: LayoutDashboard },
  ],
  finance: [
    { href: "/dashboard/finance", label: "Dashboard", icon: LayoutDashboard },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
  ],
}

export default function MainSidebar() {
  const currentUser = useAppStore((state) => state.currentUser)
  const pathname = usePathname()

  if (!currentUser) return null

  const currentNavItems = navItems[currentUser.role as keyof typeof navItems] || []

  return (
    <Sidebar className="border-r border-gray-200/80 shadow-sm bg-[#F9FAFB]">
      <SidebarHeader className="p-4 pt-6">
        <Logo size="sm" />
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  icon={<item.icon className="h-5 w-5" />}
                  className={`font-medium transition-colors duration-200 ${pathname === item.href ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {item.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton icon={<LifeBuoy/>} className="text-gray-600 hover:bg-gray-100">
                Help & Support
             </SidebarMenuButton>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
