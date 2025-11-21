/**
 * Get the default dashboard path based on user role
 */
export function getDefaultDashboardPath(role: string | null): string {
  if (!role) {
    return "/dashboard"; // Default dashboard
  }

  switch (role) {
    case "مدير عام":
    case "general_manager":
      return "/admin/dashboard";

    case "مدير قسم فني":
    case "technical_manager":
      return "/admin/dashboard";

    case "مراقبة الجودة":
    case "quality_control":
      return "/quality-control/calls";

    case "موظف كول سنتر":
    case "call_center":
      return "/employee/call-center";

    case "موظف ريسبشن":
    case "receptionist":
      return "/employee/reception";

    case "سائق":
    case "driver":
      return "/driver/my-vehicle";

    case "مندوب مبيعات":
    case "sales_rep":
      return "/employee/profile";

    case "فني صيانة":
    case "technician":
      return "/employee/profile";

    default:
      return "/dashboard"; // Fallback to dashboard
  }
}

/**
 * Check if user has access to a specific path based on their role
 */
export function canAccessPath(role: string | null, path: string): boolean {
  if (!role) {
    return false;
  }

  // Admin roles can access everything
  if (role === "مدير عام" || role === "general_manager") {
    return true;
  }

  // Technical manager can access admin and employee pages
  if (role === "مدير قسم فني" || role === "technical_manager") {
    return (
      path.startsWith("/admin") ||
      path.startsWith("/employee") ||
      path.startsWith("/dashboard")
    );
  }

  // Quality control can only access their pages
  if (role === "مراقبة الجودة" || role === "quality_control") {
    return (
      path.startsWith("/quality-control") ||
      path.startsWith("/employee/profile") ||
      path.startsWith("/dashboard")
    );
  }

  // Call center can access employee pages
  if (role === "موظف كول سنتر" || role === "call_center") {
    return (
      path.startsWith("/employee") ||
      path.startsWith("/dashboard")
    );
  }

  // Driver can access driver pages
  if (role === "سائق" || role === "driver") {
    return (
      path.startsWith("/driver") ||
      path.startsWith("/employee/profile") ||
      path.startsWith("/dashboard")
    );
  }

  // Sales rep and technician can access employee pages
  if (
    role === "مندوب مبيعات" ||
    role === "sales_rep" ||
    role === "فني صيانة" ||
    role === "technician"
  ) {
    return (
      path.startsWith("/employee") ||
      path.startsWith("/dashboard")
    );
  }

  return false;
}
