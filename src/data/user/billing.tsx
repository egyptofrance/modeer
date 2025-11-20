"use server";
import { authActionClient } from "@/lib/safe-action";
import { StripePaymentGateway } from "@/payments/StripePaymentGateway";
import { z } from "zod";

// Workspace billing has been disabled
// This file is kept for potential future user billing implementation

const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  workspaceId: z.string(),
});

export const createWorkspaceCheckoutSession = authActionClient
  .schema(createCheckoutSessionSchema)
  .action(async ({ parsedInput: { priceId, workspaceId } }) => {
    throw new Error("Workspace billing is disabled");
    // const stripePaymentGateway = new StripePaymentGateway();
    // return await stripePaymentGateway.userScope.createGatewayCheckoutSession({
    //   workspaceId,
    //   priceId,
    // });
  });
