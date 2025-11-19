import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdminClient;
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    // Get employee ID from request
    const body = await request.json();
    const { employee_id } = body;

    if (!employee_id) {
      return NextResponse.json({ success: false, error: 'يرجى تحديد الموظف' }, { status: 400 });
    }

    // Mark all unpaid incentives as paid
    const { error: updateError } = await supabaseAdminClient
      .from('customer_leads')
      .update({ incentive_paid: true })
      .eq('call_center_employee_id', employee_id)
      .eq('coupon_status', 'redeemed')
      .eq('incentive_paid', false);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم دفع الحوافز بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
