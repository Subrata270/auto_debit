
"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import NotificationBell from "./notification-bell"
import UserNav from "./user-nav"
import { useAppStore } from "@/store/app-store"
import Logo from "@/components/logo"

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
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger className="md:hidden"/>
             <div className="hidden md:flex items-center gap-2">
                <Logo size="sm" hideText={true} />
             </div>
            <h1 className="text-xl font-semibold whitespace-nowrap hidden md:block">{title}</h1>
        </div>

      <div className="flex items-center gap-4 md:gap-2 lg:gap-4">
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  )
}
