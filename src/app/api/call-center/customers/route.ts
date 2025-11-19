import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdminClient;
    
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

    // Get customer leads for this employee
    const { data: leads, error } = await supabaseAdminClient
      .from('customer_leads')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching customer leads:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب البيانات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdminClient;
    
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

    const body = await request.json();
    const { customer_name, customer_phone, product_interest } = body;

    // Generate coupon code
    const { data: couponData, error: couponError } = await supabaseAdminClient
      .rpc('generate_coupon_code', { p_employee_code: employee.employee_code });

    if (couponError) throw couponError;

    // Create customer lead
    const { data: lead, error: leadError } = await supabaseAdminClient
      .from('customer_leads')
      .insert({
        employee_id: employee.id,
        customer_name,
        customer_phone,
        product_interest,
        coupon_code: couponData,
      })
      .select()
      .single();

    if (leadError) throw leadError;

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error creating customer lead:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء العميل' },
      { status: 500 }
    );
  }
}
