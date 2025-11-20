"use client";
import { createContext, useContext } from "react";

/**
 * Context type for managing the state of the Create Workspace Dialog.
 */
interface CreateWorkspaceDialogContextType {
  /**
   * Indicates if the dialog is currently open.
   */
  isDialogOpen: boolean;
  /**
   * Function to open the dialog.
   */
  openDialog: () => void;
  /**
   * Function to close the dialog.
   */
  closeDialog: () => void;
}

/**
 * Context for the Create Workspace Dialog, providing state and actions.
 */
const CreateWorkspaceDialogContext = createContext<
  CreateWorkspaceDialogContextType | undefined
>({
  isDialogOpen: false,
  openDialog: () => {},
  closeDialog: () => {},
});

/**
 * Provider component for the Create Workspace Dialog context.
 *
 * @param children - The child components that will have access to the context.
 * @returns The provider component wrapping the children.
 */
export function CreateWorkspaceDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Since we are removing the workspace feature, this context is now a no-op provider
  // It provides the default context values and does not render the dialog or handle state.
  return (
    <CreateWorkspaceDialogContext.Provider
      value={{ isDialogOpen: false, openDialog: () => {}, closeDialog: () => {} }}
    >
      {children}
    </CreateWorkspaceDialogContext.Provider>
  );
}

/**
 * Custom hook to use the Create Workspace Dialog context.
 *
 * @returns The context value containing dialog state and actions.
 */
export function useCreateWorkspaceDialog() {
  const context = useContext(CreateWorkspaceDialogContext);
  return context;
}
