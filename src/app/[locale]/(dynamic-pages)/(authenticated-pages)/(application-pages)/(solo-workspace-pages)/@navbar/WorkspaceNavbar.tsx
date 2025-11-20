// This component is a no-op since the workspace feature is removed.
// It is kept as a placeholder to prevent import errors in other files.

import { Link } from "@/components/intl-link";
import { T } from "@/components/ui/Typography";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "Dashboard | Nextbase Ultimate",
    description: "Dashboard",
  };
}

async function Title() {
  return (
    <div className="capitalize flex items-center gap-2">
      <T.P> Dashboard</T.P>
    </div>
  );
}

export async function WorkspaceNavbar() {
  // Since the workspace feature is removed, we return a simplified navbar
  try {
    return (
      <div className="flex items-center">
        <Link href={`/dashboard`}>
          <span className="flex items-center space-x-2">
            <Title />
          </span>
        </Link>
      </div>
    );
  } catch (error) {
    return notFound();
  }
}
