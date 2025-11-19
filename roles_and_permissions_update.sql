-- =====================================================
-- تحديث نظام الأدوار والصلاحيات
-- =====================================================

-- 1. إضافة نوع موظف Quality Control
-- =====================================================
INSERT INTO public.employee_types (name, code_prefix, description) 
VALUES ('موظف مراقبة الجودة', '801', 'موظف مراقبة جودة المكالمات والخدمات')
ON CONFLICT (name) DO NOTHING;


-- 2. توسيع enum الأدوار ليشمل جميع الأدوار المطلوبة
-- =====================================================
-- ملاحظة: لا يمكن تعديل ENUM مباشرة في PostgreSQL، لذلك سنستخدم ALTER TYPE

-- إضافة الأدوار الجديدة
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'general_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'call_center';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'quality_control';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_rep';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'receptionist';


-- 3. إنشاء جدول ربط بين employee_types و app_role
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_type_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_type_id UUID REFERENCES public.employee_types(id) ON DELETE CASCADE,
    app_role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_type_id, app_role)
);

-- Enable RLS
ALTER TABLE public.employee_type_roles ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow read access to all authenticated users" 
    ON public.employee_type_roles 
    FOR SELECT 
    TO authenticated 
    USING (true);


-- 4. ربط أنواع الموظفين بالأدوار
-- =====================================================
-- مدير عام
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'general_manager'::public.app_role
FROM public.employee_types
WHERE name = 'مدير عام'
ON CONFLICT DO NOTHING;

-- مدير قسم فني
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'technical_manager'::public.app_role
FROM public.employee_types
WHERE name = 'مدير قسم فني'
ON CONFLICT DO NOTHING;

-- موظف كول سنتر
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'call_center'::public.app_role
FROM public.employee_types
WHERE name = 'موظف كول سنتر'
ON CONFLICT DO NOTHING;

-- موظف مراقبة الجودة
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'quality_control'::public.app_role
FROM public.employee_types
WHERE name = 'موظف مراقبة الجودة'
ON CONFLICT DO NOTHING;

-- سائق
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'driver'::public.app_role
FROM public.employee_types
WHERE name = 'سائق'
ON CONFLICT DO NOTHING;

-- مندوب
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'sales_rep'::public.app_role
FROM public.employee_types
WHERE name = 'مندوب'
ON CONFLICT DO NOTHING;

-- فني صيانة
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'technician'::public.app_role
FROM public.employee_types
WHERE name = 'فني صيانة'
ON CONFLICT DO NOTHING;

-- موظف ريسبشن
INSERT INTO public.employee_type_roles (employee_type_id, app_role)
SELECT id, 'receptionist'::public.app_role
FROM public.employee_types
WHERE name = 'موظف ريسبشن'
ON CONFLICT DO NOTHING;


-- 5. دالة للحصول على دور الموظف
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_employee_role(p_user_id UUID)
RETURNS public.app_role AS $$
DECLARE
    v_role public.app_role;
BEGIN
    -- أولاً: تحقق من جدول user_roles (للأدمن)
    SELECT role INTO v_role
    FROM public.user_roles
    WHERE user_id = p_user_id
    LIMIT 1;
    
    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;
    
    -- ثانياً: احصل على الدور من نوع الموظف
    SELECT etr.app_role INTO v_role
    FROM public.employees e
    JOIN public.employee_type_roles etr ON e.employee_type_id = etr.employee_type_id
    WHERE e.user_id = p_user_id
    AND e.is_active = true
    LIMIT 1;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. دالة للتحقق من صلاحية معينة
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role public.app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_employee_role(p_user_id) = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. دالة للتحقق من صلاحيات متعددة
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id UUID, p_roles public.app_role[])
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role public.app_role;
BEGIN
    v_user_role := public.get_employee_role(p_user_id);
    RETURN v_user_role = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. تحديث custom access token hook لإضافة الدور
-- =====================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    claims jsonb;
    user_role public.app_role;
BEGIN
    claims := event->'claims';
    
    -- Get user role
    user_role := public.get_employee_role((event->>'user_id')::uuid);
    
    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    ELSE
        claims := jsonb_set(claims, '{user_role}', 'null');
    END IF;
    
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;


-- =====================================================
-- انتهى التحديث
-- =====================================================

-- للتحقق من النتائج:
-- SELECT * FROM public.employee_types ORDER BY code_prefix;
-- SELECT * FROM public.employee_type_roles;
