import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { authUserMetadataSchema } from "@/utils/zod-schemas/authUserMetadata";
import { NextRequest, NextResponse } from "next/server";

// created this for testing onboarding paths
export async function GET(req: NextRequest) {
  const userId = `a1df77aa-49ca-44c7-8340-12aa4f388017`;

  try {
    // Reset user metadata to force re-onboarding
    const { error: updateError } =
      await supabaseAdminClient.auth.admin.updateUserById(userId, {
        user_metadata: authUserMetadataSchema.parse({
          onboardingHasAcceptedTerms: false,
          onboardingHasCompletedProfile: false,
          // Removed onboardingHasCreatedWorkspace
        }),
      });

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: `Successfully reset user ${userId}`,
    });
  } catch (error) {
    console.error("Error resetting user:", error);
    return NextResponse.json(
      { error: "Failed to reset user" },
      { status: 500 },
    );
  }
}
