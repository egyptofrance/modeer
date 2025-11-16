import { serverGetLoggedInUserVerified } from "@/utils/server/serverGetLoggedInUser";
import { redirect } from "next/navigation";
import { getMaybeDefaultWorkspace } from "@/data/user/workspaces";
import { getWorkspaceSubPath } from "@/utils/workspaces";

/**
 * Home Page (Fallback)
 * 
 * This page serves as a fallback when users navigate to /home without a workspace context.
 * It attempts to redirect users to their default workspace home page.
 * If no workspace is found, it redirects to the onboarding process.
 */
export default async function HomePage() {
  const user = await serverGetLoggedInUserVerified();
  
  try {
    // Attempt to get the user's default workspace
    const initialWorkspace = await getMaybeDefaultWorkspace();
    
    if (initialWorkspace) {
      // Redirect to workspace home page
      redirect(getWorkspaceSubPath(initialWorkspace.workspace, "/home"));
    }
  } catch (error) {
    console.error("Failed to get default workspace:", error);
  }
  
  // If no workspace found, redirect to onboarding
  redirect("/onboarding");
}
