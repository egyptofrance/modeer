// OrganizationSidebar.tsx (Server Component)

import { SidebarAdminPanelNav } from "@/components/sidebar-admin-panel-nav";
import { SidebarFooterUserNav } from "@/components/sidebar-footer-user-nav";
import { SidebarPlatformNav } from "@/components/sidebar-platform-nav";
import { SidebarTipsNav } from "@/components/sidebar-tips-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { notFound } from "next/navigation";

// Since the workspace feature is removed, we return a simplified sidebar
export async function SoloWorkspaceSidebar() {
  try {
    return (
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          {/* Removed SwitcherAndToggle */}
          <div className="p-4 text-lg font-bold">Modeer</div>
        </SidebarHeader>
        <SidebarContent>
          {/* Removed SidebarWorkspaceNav */}
          <SidebarAdminPanelNav />
          <SidebarPlatformNav />
          <SidebarTipsNav />
        </SidebarContent>
        <SidebarFooter>
          <SidebarFooterUserNav />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  } catch (e) {
    return notFound();
  }
}
