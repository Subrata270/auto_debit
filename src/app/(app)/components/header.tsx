"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import NotificationBell from "./notification-bell"
import UserNav from "./user-nav"
import { useAppStore } from "@/store/app-store"
import { PlusCircle } from "lucide-react"
import { useState } from "react"
import NewRequestDialog from "../dashboard/employee/new-request-dialog"

export default function Header() {
  const { currentUser } = useAppStore()
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

  const portalTitles: Record<string, string> = {
    employee: "Employee Portal",
    hod: "HOD Portal",
    finance: "Finance Portal",
    admin: "Admin Portal",
  }
  
  const title = currentUser ? portalTitles[currentUser.role] : "Dashboard"

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden"/>
            <h1 className="text-xl font-semibold hidden md:block">{title}</h1>
        </div>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {currentUser?.role === 'employee' && (
            <>
              <Button onClick={() => setIsNewRequestOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/> Request New Subscription
              </Button>
              <NewRequestDialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen} />
            </>
          )}
        </div>
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  )
}