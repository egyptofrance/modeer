"use client";

import { Link } from "@/components/intl-link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { DBTable } from "@/types";
import {
  ArrowLeft,
  Layers,
  Settings
} from "lucide-react";

interface ProjectSidebarGroupProps {
  project: DBTable<"projects">;
}

export function ProjectSidebarGroup({
  project,
}: ProjectSidebarGroupProps) {
  const projectLinks = [
    {
      label: "Back to Dashboard",
      href: `/dashboard`,
      icon: <ArrowLeft className="h-5 w-5" />,
    },
    {
      label: "Project Home",
      href: `/project/${project.slug}`,
      icon: <Layers className="h-5 w-5" />,
    },

    {
      label: "Project Settings",
      href: `/project/${project.slug}/settings`,
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Project</SidebarGroupLabel>
      <SidebarMenu>
        {projectLinks.map((link) => (
          <SidebarMenuItem key={link.label}>
            <SidebarMenuButton asChild>
              <Link href={link.href}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
