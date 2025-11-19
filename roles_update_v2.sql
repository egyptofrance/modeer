-- =====================================================
-- تحديث نظام الأدوار والصلاحيات (النسخة 2)
-- بدون استخدام ENUM - استخدام جدول roles
-- =====================================================

-- 1. إضافة نوع موظف Quality Control
-- =====================================================
INSERT INTO public.employee_types (name, code_prefix, description) 
VALUES ('موظف مراقبة الجودة', '801', 'موظف مراقبة جودة المكالمات والخدمات')
ON CONFLICT (name) DO NOTHING;


-- 2. إنشاء جدول الأدوار (بدلاً من ENUM)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0, -- مستوى الصلاحية (كلما زاد الرقم، زادت الصلاحيات)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow read access to all authenticated users" 
    ON public.roles 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- إدراج الأدوار
INSERT INTO public.roles (name, display_name, description, level) VALUES
    ('admin', 'مدير النظام', 'صلاحيات كاملة على النظام', 100),
    ('general_manager', 'مدير عام', 'إدارة الشركة بالكامل', 90),
    ('technical_manager', 'مدير قسم فني', 'إدارة القسم الفني والفنيين', 80),
    ('quality_control', 'مراقبة الجودة', 'مراقبة المكالمات والخدمات', 70),
    ('call_center', 'موظف كول سنتر', 'استقبال المكالمات وتسجيل العملاء', 50),
    ('receptionist', 'موظف ريسبشن', 'استقبال العملاء', 50),
    ('sales_rep', 'مندوب مبيعات', 'التسويق والمبيعات', 40),
    ('technician', 'فني صيانة', 'صيانة الأجهزة', 40),
    ('driver', 'سائق', 'نقل الأجهزة والعملاء', 30)
ON CONFLICT (name) DO NOTHING;


-- 3. تحديث جدول user_roles ليستخدم TEXT بدلاً من ENUM
-- =====================================================
-- إنشاء جدول جديد
CREATE TABLE IF NOT EXISTS public.user_roles_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

-- نسخ البيانات القديمة (تحويل admin من ENUM إلى TEXT)
INSERT INTO public.user_roles_new (user_id, role_name, created_at)
SELECT user_id, role::TEXT, NOW()
FROM public.user_roles
ON CONFLICT DO NOTHING;

-- حذف الجدول القديم وإعادة تسمية الجديد
DROP TABLE IF EXISTS public.user_roles CASCADE;
ALTER TABLE public.user_roles_new RENAME TO user_roles;

-- إنشاء الـ indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_name ON public.user_roles(role_name);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own roles" 
    ON public.user_roles 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Allow auth admin to read user roles" 
    ON public.user_roles 
    AS PERMISSIVE FOR SELECT 
    TO supabase_auth_admin 
    USING (TRUE);

-- Grants
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon;


-- 4. إنشاء جدول ربط بين employee_types و roles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_type_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_type_id UUID REFERENCES public.employee_types(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_type_id, role_name)
);

-- Enable RLS
ALTER TABLE public.employee_type_roles ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow read access to all authenticated users" 
    ON public.employee_type_roles 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- ربط أنواع الموظفين بالأدوار
INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'general_manager'
FROM public.employee_types et
WHERE et.name = 'مدير عام'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'technical_manager'
FROM public.employee_types et
WHERE et.name = 'مدير قسم فني'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'call_center'
FROM public.employee_types et
WHERE et.name = 'موظف كول سنتر'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'quality_control'
FROM public.employee_types et
WHERE et.name = 'موظف مراقبة الجودة'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'driver'
FROM public.employee_types et
WHERE et.name = 'سائق'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'sales_rep'
FROM public.employee_types et
WHERE et.name = 'مندوب'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'technician'
FROM public.employee_types et
WHERE et.name = 'فني صيانة'
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_type_roles (employee_type_id, role_name)
SELECT et.id, 'receptionist'
FROM public.employee_types et
WHERE et.name = 'موظف ريسبشن'
ON CONFLICT DO NOTHING;


-- 5. دالة للحصول على دور الموظف
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- أولاً: تحقق من جدول user_roles (للأدمن والأدوار المخصصة)
    SELECT role_name INTO v_role
    FROM public.user_roles
    WHERE user_id = p_user_id
    ORDER BY (SELECT level FROM public.roles WHERE name = role_name) DESC
    LIMIT 1;
    
    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;
    
    -- ثانياً: احصل على الدور من نوع الموظف
    SELECT etr.role_name INTO v_role
    FROM public.employees e
    JOIN public.employee_type_roles etr ON e.employee_type_id = etr.employee_type_id
    WHERE e.user_id = p_user_id
    AND e.is_active = true
    ORDER BY (SELECT level FROM public.roles WHERE name = etr.role_name) DESC
    LIMIT 1;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. دالة للتحقق من صلاحية معينة
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. دالة للتحقق من صلاحيات متعددة
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    v_user_role := public.get_user_role(p_user_id);
    RETURN v_user_role = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. دالة للتحقق من مستوى الصلاحية
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role_level(p_user_id UUID, p_min_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_user_level INTEGER;
BEGIN
    v_user_role := public.get_user_role(p_user_id);
    
    IF v_user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT level INTO v_user_level
    FROM public.roles
    WHERE name = v_user_role;
    
    RETURN v_user_level >= p_min_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. تحديث custom access token hook
-- =====================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    claims jsonb;
    user_role TEXT;
BEGIN
    claims := event->'claims';
    
    -- Get user role
    user_role := public.get_user_role((event->>'user_id')::uuid);
    
    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    ELSE
        claims := jsonb_set(claims, '{user_role}', 'null');
    END IF;
    
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;


-- =====================================================
-- انتهى التحديث
-- =====================================================

-- للتحقق من النتائج:
SELECT 'Employee Types:' as info;
SELECT * FROM public.employee_types ORDER BY code_prefix;

SELECT 'Roles:' as info;
SELECT * FROM public.roles ORDER BY level DESC;

SELECT 'Employee Type Roles Mapping:' as info;
SELECT 
    et.name as employee_type,
    et.code_prefix,
    r.display_name as role,
    r.level
FROM public.employee_types et
LEFT JOIN public.employee_type_roles etr ON et.id = etr.employee_type_id
LEFT JOIN public.roles r ON etr.role_name = r.name
ORDER BY et.code_prefix;
