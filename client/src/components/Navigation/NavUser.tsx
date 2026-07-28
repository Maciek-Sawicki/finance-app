"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  // AuthProvider already resolves /auth/me once on mount (cookie-based), so
  // this no longer needs its own fallback fetch - user here is the single
  // source of truth.
  const { user, signOut } = useAuth()
  const { isMobile } = useSidebar()
  const navigate = useNavigate();

  if (!user) return null

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username || user.email || "User"

  const getFirstLetters = (name?: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase() || "")
      .slice(0, 2)
      .join("")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-9 w-9 rounded-md">
                <AvatarImage alt={displayName} />
                <AvatarFallback className="rounded-lg">{getFirstLetters(displayName)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-md">
                  <AvatarImage alt={displayName} />
                  <AvatarFallback className="rounded-lg">{getFirstLetters(displayName)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate("/profile")}>
            {/* <DropdownMenuItem> */}
                <BadgeCheck />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
