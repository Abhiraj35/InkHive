"use client"

import * as React from "react"
import { UserButton, useUser } from "@clerk/nextjs"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  FileTextIcon,
  FolderOpenIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  PlusIcon,
} from "lucide-react"
import { Logo } from "./logo"
import Link from "next/link"
import { useProjects } from "@/components/providers/projects-provider"

export const AppSidebar = React.memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const { projects } = useProjects()

  const userData = React.useMemo(
    () => ({
      name: user?.fullName ?? user?.username ?? "User",
      email:
        user?.primaryEmailAddress?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress ??
        "",
      avatar: user?.imageUrl ?? "",
    }),
    [user],
  )

  const teams = React.useMemo(
    () => [
      {
        name: "InkHive",
        logo: <GalleryVerticalEndIcon />,
      },
    ],
    [],
  )

  const navMain = React.useMemo(
    () => [
      {
        title: "Workspace",
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: true,
        items: [
          { title: "Dashboard", url: "/dashboard" },
          { title: "Create Task", url: "/create" },
          { title: "Home", url: "/" },
        ],
      }
    ],
    [],
  )

  const projectLinks = React.useMemo(
    () =>
      (projects ?? []).slice(0, 8).map((project) => ({
        id: project._id,
        name: project.title || project.inputContent.slice(0, 36),
        url: `/dashboard/${project._id}`,
        icon: <FileTextIcon />,
      })),
    [projects],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pt-5">
        {/* <TeamSwitcher teams={teams} /> */}
        <Link
          href="/"
          aria-label="home"
          className="flex items-center space-x-2">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects
          projects={
            projectLinks.length > 0
              ? projectLinks
              : [{ name: "Create your first project", url: "/create", icon: <PlusIcon /> }]
          }
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
})
