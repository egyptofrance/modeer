import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdminClient;
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    // Get all call center employees
    const { data: employees, error: employeesError } = await supabaseAdminClient
      .from('employees')
      .select('id, full_name, employee_code')
      .eq('employee_type_id', (
        await supabaseAdminClient
          .from('employee_types')
          .select('id')
          .eq('name', 'موظف كول سنتر')
          .single()
      ).data?.id || '');

    if (employeesError) {
      return NextResponse.json({ success: false, error: employeesError.message }, { status: 500 });
    }

    // Get stats for each employee
    const employeesWithStats = await Promise.all(
      (employees || []).map(async (emp) => {
        const { data: stats } = await supabaseAdminClient
          .rpc('get_call_center_stats', { p_employee_id: emp.id });

        return {
          employee_id: emp.id,
          employee_name: emp.full_name,
          employee_code: emp.employee_code,
          total_leads: stats?.total_leads || 0,
          redeemed_leads: stats?.redeemed_leads || 0,
          pending_leads: stats?.pending_leads || 0,
          conversion_rate: stats?.conversion_rate || 0,
          total_incentives: stats?.total_incentives || 0,
          paid_incentives: stats?.paid_incentives || 0,
          unpaid_incentives: stats?.unpaid_incentives || 0,
        };
      })
    );

    // Calculate summary
    const summary = {
      total_employees: employeesWithStats.length,
      total_customers: employeesWithStats.reduce((sum, emp) => sum + emp.total_leads, 0),
      redeemed_customers: employeesWithStats.reduce((sum, emp) => sum + emp.redeemed_leads, 0),
      total_unpaid: employeesWithStats.reduce((sum, emp) => sum + emp.unpaid_incentives, 0),
      total_paid: employeesWithStats.reduce((sum, emp) => sum + emp.paid_incentives, 0),
    };

    return NextResponse.json({
      success: true,
      employees: employeesWithStats,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
