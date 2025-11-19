import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coupon_code } = body;

    if (!coupon_code) {
      return NextResponse.json(
        { success: false, error: 'كود الكوبون مطلوب' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabaseAdminClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    // Get employee ID
    const { data: employee } = await supabaseAdminClient
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'الموظف غير موجود' }, { status: 404 });
    }

    // Redeem coupon
    const { data, error } = await supabaseAdminClient
      .rpc('redeem_coupon', {
        p_coupon_code: coupon_code,
        p_redeemed_by: employee.id,
      });

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'كود الكوبون غير صحيح' },
          { status: 404 }
        );
      }
      if (error.message.includes('already redeemed')) {
        return NextResponse.json(
          { success: false, error: 'تم تفعيل هذا الكوبون مسبقاً' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تفعيل الكوبون' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coupon_code = searchParams.get('coupon_code');

    if (!coupon_code) {
      return NextResponse.json(
        { success: false, error: 'كود الكوبون مطلوب' },
        { status: 400 }
      );
    }

    // Get coupon details
    const { data: lead, error } = await supabaseAdminClient
      .from('customer_leads')
      .select(`
        *,
        employees (
          full_name,
          employee_code
        )
      `)
      .eq('coupon_code', coupon_code)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'كود الكوبون غير صحيح' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب البيانات' },
      { status: 500 }
    );
  }
}
