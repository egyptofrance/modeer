// ApplicationAdminSidebar.tsx (Server Component)

import { SidebarAdminPanelNav } from "@/components/sidebar-admin-panel-nav";
import { SidebarFooterUserNav } from "@/components/sidebar-footer-user-nav";
import { SidebarPlatformNav } from "@/components/sidebar-platform-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { notFound, unstable_rethrow } from "next/navigation";

export async function ApplicationAdminSidebar() {
  try {
    return (
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          {/* Simplified header without workspace switcher */}
        </SidebarHeader>
        <SidebarContent>
          <SidebarAdminPanelNav />
          <SidebarPlatformNav />
        </SidebarContent>
        <SidebarFooter>
          <SidebarFooterUserNav />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  } catch (e) {
    unstable_rethrow(e);
    console.error(e);
    return notFound();
  }
}
