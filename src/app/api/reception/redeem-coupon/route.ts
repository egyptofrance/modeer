import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    // Get employee
    const { data: employee } = await supabaseAdminClient
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'الموظف غير موجود' }, { status: 404 });
    }

    // Get coupon code from request
    const body = await request.json();
    const { coupon_code } = body;

    if (!coupon_code) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال كود الكوبون' }, { status: 400 });
    }

    // Redeem coupon using RPC function
    const { data: result, error: redeemError } = await supabaseAdminClient
      .rpc('redeem_coupon', {
        p_coupon_code: coupon_code,
        p_reception_employee_id: employee.id,
      });

    if (redeemError) {
      return NextResponse.json({ success: false, error: redeemError.message }, { status: 500 });
    }

    // Check if redemption was successful
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
