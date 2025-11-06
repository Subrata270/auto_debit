"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import NotificationBell from "./notification-bell"
import UserNav from "./user-nav"
import { useAppStore } from "@/store/app-store"

export default function Header() {
  const { currentUser } = useAppStore()

  const portalTitles: Record<string, string> = {
    employee: "Department of POC",
    hod: "HOD Portal",
    finance: "Finance Portal",
    admin: "Admin Portal",
  }
  
  const title = currentUser ? portalTitles[currentUser.role] : "Dashboard"

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="md:hidden"/>
            <h1 className="text-xl font-semibold whitespace-nowrap">{title}</h1>
        </div>

      <div className="flex items-center gap-4 md:gap-2 lg:gap-4">
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  )
}
