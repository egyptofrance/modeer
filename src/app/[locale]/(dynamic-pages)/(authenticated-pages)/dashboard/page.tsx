import { serverGetLoggedInUserVerified } from "@/utils/server/serverGetLoggedInUser";
import { redirect } from "next/navigation";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";

/**
 * Dashboard Page - Employee Role-Based Redirect
 * 
 * This page redirects employees to their role-specific dashboards
 * based on their employee_type instead of requiring workspace creation.
 */
export default async function DashboardPage() {
  const user = await serverGetLoggedInUserVerified();
  
  try {
    // Get employee data with their type
    const { data: employee, error } = await supabaseAdminClient
      .from('employees')
      .select(`
        *,
        employee_types (
          name_ar,
          permission_level
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error || !employee) {
      // If not an employee, redirect to home
      redirect('/');
    }

    const employeeType = employee.employee_types;
    const permissionLevel = employeeType?.permission_level || 0;

    // Redirect based on employee type and permission level
    if (permissionLevel >= 90) {
      // مدير عام - General Manager
      redirect('/admin/dashboard');
    } else if (permissionLevel >= 80) {
      // مدير قسم فني - Technical Department Manager
      redirect('/admin/dashboard');
    } else if (permissionLevel >= 70) {
      // مراقبة الجودة - Quality Control
      redirect('/quality-control/calls');
    } else if (permissionLevel >= 50) {
      // موظف كول سنتر - Call Center Employee
      redirect('/employee/call-center');
    } else if (permissionLevel >= 40) {
      // Check specific role for reception, delegate, or technician
      const roleNameAr = employeeType?.name_ar || '';
      
      if (roleNameAr.includes('ريسبشن')) {
        // موظف ريسبشن - Reception Employee
        redirect('/reception/activate-coupon');
      } else if (roleNameAr.includes('مندوب')) {
        // مندوب - Delegate
        redirect('/employee/profile');
      } else if (roleNameAr.includes('فني')) {
        // فني صيانة - Technician
        redirect('/employee/profile');
      } else {
        // Default for level 40
        redirect('/employee/profile');
      }
    } else if (permissionLevel >= 30) {
      // سائق - Driver
      redirect('/driver/my-vehicle');
    } else {
      // Default redirect for unknown roles
      redirect('/employee/profile');
    }

  } catch (error) {
    console.error("Failed to get employee data:", error);
    // On error, redirect to home
    redirect('/');
  }
}
