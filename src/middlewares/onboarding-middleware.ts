import { NextResponse } from "next/server";
import { toSiteURL } from "../utils/helpers";
import { middlewareLogger } from "../utils/logger";
import { getDefaultDashboardPath } from "../utils/role-redirect";
import { dashboardRoutesWithLocale, onboardingPathsWithLocale } from "./paths";
import { MiddlewareConfig } from "./types";
import { shouldOnboardUser, withMaybeLocale } from "./utils";

export const dashboardOnboardingMiddleware: MiddlewareConfig = {
  matcher: dashboardRoutesWithLocale,
  middleware: async (req, maybeUser) => {
    middlewareLogger.log(
      "middleware dashboard paths with locale",
      req.nextUrl.pathname,
    );
    const res = NextResponse.next();

    if (!maybeUser) {
      throw new Error("User is not logged in");
    }

    if (shouldOnboardUser(maybeUser)) {
      middlewareLogger.log(
        "User should onboard. Redirecting to onboarding.",
        req.nextUrl.pathname,
      );
      return [
        NextResponse.redirect(toSiteURL(withMaybeLocale(req, "/onboarding"))),
        maybeUser,
      ];
    }

    return [res, maybeUser];
  },
};

export const onboardingRedirectMiddleware: MiddlewareConfig = {
  matcher: onboardingPathsWithLocale,
  middleware: async (req, maybeUser) => {
    middlewareLogger.log(
      "middleware onboarding paths with locale",
      req.nextUrl.pathname,
    );
    const res = NextResponse.next();

    if (!maybeUser) {
      throw new Error("User is not logged in");
    }

    if (!shouldOnboardUser(maybeUser)) {
      middlewareLogger.log(
        "User should not onboard. Redirecting to dashboard.",
        req.nextUrl.pathname,
      );
      
      // Get user role from app_metadata
      const userRole = maybeUser.app_metadata?.role as string | null;
      const dashboardPath = getDefaultDashboardPath(userRole);
      
      middlewareLogger.log(
        `Redirecting user with role "${userRole}" to ${dashboardPath}`,
        req.nextUrl.pathname,
      );
      
      return [
        NextResponse.redirect(toSiteURL(withMaybeLocale(req, dashboardPath))),
        maybeUser,
      ];
    }

    return [res, maybeUser];
  },
};
