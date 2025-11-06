"use client"

import { Bell, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/store/app-store"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function NotificationBell() {
  const { currentUser, notifications, readNotification } = useAppStore()
  
  if (!currentUser) return null;

  const userNotifications = notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
  const unreadCount = userNotifications.filter(n => !n.isRead).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative transition-transform duration-200 hover:animate-pulse">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {userNotifications.length > 0 ? (
            userNotifications.map(notification => (
              <DropdownMenuItem key={notification.id} onSelect={(e) => e.preventDefault()} onClick={() => readNotification(notification.id)} className={`flex items-start gap-3 whitespace-normal ${!notification.isRead ? 'bg-secondary' : ''}`}>
                <div className={`mt-1 h-2 w-2 rounded-full ${!notification.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {notification.isRead && <Check className="h-4 w-4 text-green-500" />}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
                You have no new notifications.
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
