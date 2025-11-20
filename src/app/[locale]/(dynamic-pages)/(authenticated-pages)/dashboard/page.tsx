import { serverGetLoggedInUserVerified } from "@/utils/server/serverGetLoggedInUser";
import { redirect } from "next/navigation";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";

/**
 * Dashboard Page - Employee Role-Based Redirect
 * 
 * This page redirects employees to their role-specific dashboards
 * based on their employee_type code_prefix.
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
          name,
          code_prefix
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error || !employee) {
      // If not an employee, redirect to home
      redirect('/');
    }

    const employeeType = employee.employee_types;
    const codePrefix = employeeType?.code_prefix || '';

    // Redirect based on employee type code_prefix
    // Code prefixes: 101=Call Center, 201=Reception, 301=Driver, 
    //                401=Delegate, 501=Technician, 601=Tech Manager, 
    //                701=General Manager, 801=Quality Control
    
    if (codePrefix.startsWith('701')) {
      // 701 = مدير عام - General Manager
      redirect('/admin/dashboard');
    } else if (codePrefix.startsWith('601')) {
      // 601 = مدير قسم فني - Technical Department Manager
      redirect('/admin/dashboard');
    } else if (codePrefix.startsWith('801')) {
      // 801 = مراقبة الجودة - Quality Control
      redirect('/quality-control/calls');
    } else if (codePrefix.startsWith('101')) {
      // 101 = موظف كول سنتر - Call Center Employee
      redirect('/employee/call-center');
    } else if (codePrefix.startsWith('201')) {
      // 201 = موظف ريسبشن - Reception Employee
      redirect('/reception/activate-coupon');
    } else if (codePrefix.startsWith('401')) {
      // 401 = مندوب - Delegate
      redirect('/employee/profile');
    } else if (codePrefix.startsWith('501')) {
      // 501 = فني صيانة - Technician
      redirect('/employee/profile');
    } else if (codePrefix.startsWith('301')) {
      // 301 = سائق - Driver
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
