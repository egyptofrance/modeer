// @ts-nocheck
'use server';

import { createClient } from '@supabase/supabase-js';

// استخدام Service Role Key للـ Admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface CreateEmployeeParams {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  employee_type_id: string;
  base_salary: number;
  date_of_birth?: string;
  qualification_level?: string;
  qualification_name?: string;
  address?: string;
  gender?: string;
}

export async function createEmployee(params: CreateEmployeeParams) {
  try {
    // 1. إنشاء Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.full_name,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { data: null, error: authError.message };
    }

    if (!authData.user) {
      return { data: null, error: 'فشل في إنشاء حساب المستخدم' };
    }

    // 2. الحصول على employee_type للحصول على code_prefix
    const { data: employeeType, error: typeError } = await supabaseAdmin
      .from('employee_types')
      .select('code_prefix')
      .eq('id', params.employee_type_id)
      .single();

    if (typeError || !employeeType) {
      // حذف Auth User إذا فشل
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { data: null, error: 'نوع الوظيفة غير موجود' };
    }

    // 3. إنشاء employee_code تلقائي
    // الحصول على آخر رقم لهذا النوع
    const { data: lastEmployee } = await supabaseAdmin
      .from('employees')
      .select('employee_code')
      .like('employee_code', `${employeeType.code_prefix}-%`)
      .order('employee_code', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastEmployee?.employee_code) {
      const parts = lastEmployee.employee_code.split('-');
      if (parts.length === 2) {
        nextNumber = parseInt(parts[1]) + 1;
      }
    }

    const employee_code = `${employeeType.code_prefix}-${String(nextNumber).padStart(3, '0')}`;

    // 4. حساب الراتب اليومي
    const daily_salary = params.base_salary / 30;

    // 5. إنشاء سجل في جدول employees
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: authData.user.id,
        employee_type_id: params.employee_type_id,
        employee_code: employee_code,
        full_name: params.full_name,
        email: params.email,
        phone: params.phone,
        base_salary: params.base_salary,
        daily_salary: daily_salary,
        date_of_birth: params.date_of_birth || null,
        qualification_level: params.qualification_level || null,
        qualification_name: params.qualification_name || null,
        address: params.address || null,
        gender: params.gender || null,
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
      })
      .select()
      .single();

    if (employeeError) {
      console.error('Employee insert error:', employeeError);
      // حذف Auth User إذا فشل
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { data: null, error: employeeError.message };
    }

    // 6. إنشاء رصيد إجازات تلقائي
    const currentYear = new Date().getFullYear();
    const { error: balanceError } = await supabaseAdmin
      .from('leave_balance')
      .insert({
        employee_id: employee.id,
        year: currentYear,
        annual_leave_total: 21,
        annual_leave_used: 0,
        sick_leave_total: 15,
        sick_leave_used: 0,
        emergency_leave_total: 7,
        emergency_leave_used: 0,
      });

    if (balanceError) {
      console.warn('Failed to create leave balance:', balanceError);
      // لا نحذف الموظف، فقط نسجل تحذير
    }

    // 7. إنشاء سجل مستندات فارغ
    const { error: documentsError } = await supabaseAdmin
      .from('employee_documents')
      .insert({
        employee_id: employee.id,
        documents_complete: false,
        documents_verified: false,
      });

    if (documentsError) {
      console.warn('Failed to create documents record:', documentsError);
    }

    return {
      data: {
        employee,
        auth_user: authData.user,
        employee_code,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { data: null, error: error.message || 'حدث خطأ غير متوقع' };
  }
}

// دالة لتحديث بيانات الموظف (للموظف نفسه)
export async function updateEmployeeProfile(params: {
  employee_id: string;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  qualification_level?: string;
  qualification_name?: string;
  address?: string;
  gender?: string;
  personal_phone?: string;
  relative_name?: string;
  relative_phone?: string;
  relative_relation?: string;
  company_phone?: string;
  profile_photo_url?: string;
}) {
  try {
    const { employee_id, ...updateData } = params;

    const { data, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', employee_id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// دالة للحصول على أنواع الوظائف
export async function getEmployeeTypes() {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_types')
      .select('*')
      .order('name');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
