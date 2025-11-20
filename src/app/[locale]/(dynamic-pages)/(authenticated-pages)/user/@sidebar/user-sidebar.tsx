// UserSidebar.tsx (Server Component)

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
import { unstable_rethrow } from "next/navigation";

export async function UserSidebar() {
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
  }
}
