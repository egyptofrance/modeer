import { serverGetLoggedInUserVerified } from "@/utils/server/serverGetLoggedInUser";
import { redirect } from "next/navigation";
import { getMaybeDefaultWorkspace } from "@/data/user/workspaces";
import { getWorkspaceSubPath } from "@/utils/workspaces";
import Link from "next/link";

/**
 * Dashboard Page
 * 
 * This page handles the redirect after onboarding completion.
 * It attempts to redirect users to their default workspace home page.
 * If no workspace is found, it displays a message with a link to create one.
 */
export default async function DashboardPage() {
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
  
  // If no workspace found, display a message
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Welcome, {user.email}!
        </h1>
        <p className="text-gray-600 mb-6">
          No workspace found. Please create a new workspace to get started.
        </p>
        <Link 
          href="/onboarding" 
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Workspace
        </Link>
      </div>
    </div>
  );
}
