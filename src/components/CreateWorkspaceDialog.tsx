"use client";
// This component is a no-op since the workspace feature is removed.
// It is kept as a placeholder to prevent import errors in other files.

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useCreateWorkspaceDialog } from "@/contexts/CreateWorkspaceDialogContext";

export function CreateWorkspaceDialog() {
  const { isDialogOpen, closeDialog } = useCreateWorkspaceDialog();

  // Since the workspace feature is removed, this dialog should never open.
  // We keep the component structure to prevent import errors.
  return (
    <Dialog
      open={isDialogOpen}
      data-testid="create-workspace-dialog"
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent>
        {/* Content removed as the feature is disabled */}
      </DialogContent>
    </Dialog>
  );
}
