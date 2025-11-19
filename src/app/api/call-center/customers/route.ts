import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    // Get employee ID
    const { data: employee } = await supabaseAdminClient
      .from('employees')
      .select('id, employee_code')
      .eq('user_id', user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'الموظف غير موجود' }, { status: 404 });
    }

    // Get customers
    const { data: customers, error: customersError } = await supabaseAdminClient
      .from('customer_leads')
      .select('*')
      .eq('call_center_employee_id', employee.id)
      .order('created_at', { ascending: false });

    if (customersError) {
      return NextResponse.json({ success: false, error: customersError.message }, { status: 500 });
    }

    // Get stats
    const { data: statsData, error: statsError } = await supabaseAdminClient
      .rpc('get_call_center_stats', { p_employee_id: employee.id });

    const stats = statsData || {
      total_leads: 0,
      redeemed_leads: 0,
      pending_leads: 0,
      conversion_rate: 0,
      total_incentives: 0,
      paid_incentives: 0,
      unpaid_incentives: 0,
    };

    return NextResponse.json({
      success: true,
      customers: customers || [],
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
      .select('id, employee_code')
      .eq('user_id', user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'الموظف غير موجود' }, { status: 404 });
    }

    // Get form data
    const body = await request.json();
    const { customer_name, customer_phone, customer_email, product_interest, notes } = body;

    // Validate
    if (!customer_name || !customer_phone || !product_interest) {
      return NextResponse.json({ success: false, error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    // Generate coupon code
    const { data: couponData, error: couponError } = await supabaseAdminClient
      .rpc('generate_coupon_code', { p_employee_code: employee.employee_code });

    if (couponError) {
      return NextResponse.json({ success: false, error: couponError.message }, { status: 500 });
    }

    const coupon_code = couponData;

    // Insert customer lead
    const { data: lead, error: leadError } = await supabaseAdminClient
      .from('customer_leads')
      .insert({
        customer_name,
        customer_phone,
        customer_email,
        product_interest,
        notes,
        call_center_employee_id: employee.id,
        call_center_employee_code: employee.employee_code,
        coupon_code,
      })
      .select()
      .single();

    if (leadError) {
      return NextResponse.json({ success: false, error: leadError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coupon_code,
      lead,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
