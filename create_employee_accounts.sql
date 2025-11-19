-- =====================================================
-- إنشاء حسابات الموظفين
-- =====================================================
-- ملاحظة: يجب تنفيذ هذا الكود من خلال Supabase Dashboard
-- لأن إنشاء المستخدمين يتطلب صلاحيات supabase_auth_admin

-- =====================================================
-- 1. أميرة الشافعي - مدير عام
-- =====================================================
-- Email: amira.elshafei@modeer.com
-- Password: Amira@2025

-- سيتم إنشاء الحساب من خلال Supabase Dashboard
-- ثم تشغيل هذا الكود لإضافة بيانات الموظف

-- بعد إنشاء المستخدم، احصل على user_id واستبدله هنا
DO $$
DECLARE
    v_user_id UUID;
    v_employee_type_id UUID;
BEGIN
    -- الحصول على user_id (استبدل بالـ UUID الفعلي بعد إنشاء المستخدم)
    -- v_user_id := 'USER_ID_HERE';
    
    -- الحصول على employee_type_id لمدير عام
    SELECT id INTO v_employee_type_id
    FROM public.employee_types
    WHERE name = 'مدير عام';
    
    -- إدراج بيانات الموظف
    -- INSERT INTO public.employees (
    --     user_id,
    --     employee_type_id,
    --     employee_code,
    --     full_name,
    --     phone,
    --     email,
    --     base_salary,
    --     is_active
    -- ) VALUES (
    --     v_user_id,
    --     v_employee_type_id,
    --     '7010001',
    --     'أميرة الشافعي',
    --     '01234567890',
    --     'amira.elshafei@modeer.com',
    --     15000.00,
    --     true
    -- );
    
    -- إضافة الدور
    -- INSERT INTO public.user_roles (user_id, role_name)
    -- VALUES (v_user_id, 'general_manager');
END $$;


-- =====================================================
-- 2. أسامة ميخائيل - مدير قسم فني
-- =====================================================
-- Email: osama.mikhail@modeer.com
-- Password: Osama@2025

-- =====================================================
-- 3. محمد الدسوقي - مدير قسم فني
-- =====================================================
-- Email: mohamed.eldesoky@modeer.com
-- Password: Mohamed@2025

-- =====================================================
-- 4. فادي - موظف كول سنتر
-- =====================================================
-- Email: fady@modeer.com
-- Password: Fady@2025

-- =====================================================
-- 5. أسامة - موظف كول سنتر
-- =====================================================
-- Email: osama.cc@modeer.com
-- Password: OsamaCC@2025

-- =====================================================
-- 6. يوسف - موظف كول سنتر
-- =====================================================
-- Email: youssef@modeer.com
-- Password: Youssef@2025

-- =====================================================
-- 7. سمية - موظف مراقبة الجودة
-- =====================================================
-- Email: somaya@modeer.com
-- Password: Somaya@2025

-- =====================================================
-- 8. هاني - سائق
-- =====================================================
-- Email: hany@modeer.com
-- Password: Hany@2025

-- =====================================================
-- 9. عبد الرحمن - مندوب
-- =====================================================
-- Email: abdelrahman@modeer.com
-- Password: Abdelrahman@2025

-- =====================================================
-- 10. أدهم - فني صيانة
-- =====================================================
-- Email: adham@modeer.com
-- Password: Adham@2025


-- =====================================================
-- دالة مساعدة لإنشاء موظف بعد إنشاء المستخدم
-- =====================================================
CREATE OR REPLACE FUNCTION create_employee_after_signup(
    p_user_id UUID,
    p_employee_type_name TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_base_salary DECIMAL DEFAULT 5000.00
)
RETURNS UUID AS $$
DECLARE
    v_employee_type_id UUID;
    v_employee_code TEXT;
    v_employee_id UUID;
    v_role_name TEXT;
BEGIN
    -- الحصول على employee_type_id
    SELECT id INTO v_employee_type_id
    FROM public.employee_types
    WHERE name = p_employee_type_name;
    
    IF v_employee_type_id IS NULL THEN
        RAISE EXCEPTION 'نوع الموظف غير موجود: %', p_employee_type_name;
    END IF;
    
    -- توليد employee_code
    v_employee_code := generate_employee_code(v_employee_type_id);
    
    -- إدراج بيانات الموظف
    INSERT INTO public.employees (
        user_id,
        employee_type_id,
        employee_code,
        full_name,
        phone,
        email,
        base_salary,
        is_active
    ) VALUES (
        p_user_id,
        v_employee_type_id,
        v_employee_code,
        p_full_name,
        p_phone,
        p_email,
        p_base_salary,
        true
    ) RETURNING id INTO v_employee_id;
    
    -- الحصول على الدور المناسب
    SELECT role_name INTO v_role_name
    FROM public.employee_type_roles
    WHERE employee_type_id = v_employee_type_id
    LIMIT 1;
    
    -- إضافة الدور
    IF v_role_name IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_name)
        VALUES (p_user_id, v_role_name)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- ملاحظات مهمة للتنفيذ:
-- =====================================================
-- 1. يجب إنشاء المستخدمين أولاً من Supabase Dashboard → Authentication → Add User
-- 2. بعد إنشاء كل مستخدم، استخدم الدالة create_employee_after_signup
-- 3. مثال:
--    SELECT create_employee_after_signup(
--        'USER_ID_FROM_AUTH',
--        'مدير عام',
--        'أميرة الشافعي',
--        '01234567890',
--        'amira.elshafei@modeer.com',
--        15000.00
--    );
