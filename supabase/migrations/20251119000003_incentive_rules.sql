-- Incentive Rules System
-- Migration: 20251119000003_incentive_rules
-- Phase 3: Incentive Management System

-- إنشاء جدول الحوافز المقررة
CREATE TABLE IF NOT EXISTS public.incentive_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_type_id UUID REFERENCES public.employee_types(id) ON DELETE CASCADE NOT NULL,
    
    -- بيانات الحافز
    incentive_name TEXT NOT NULL,
    incentive_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    incentive_type TEXT NOT NULL CHECK (incentive_type IN ('ثابت', 'متغير', 'نسبة مئوية')),
    
    -- الوصف والشروط
    description TEXT,
    conditions TEXT,
    
    -- الحالة
    is_active BOOLEAN DEFAULT TRUE,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_incentive_rules_employee_type ON public.incentive_rules(employee_type_id);
CREATE INDEX IF NOT EXISTS idx_incentive_rules_active ON public.incentive_rules(is_active);

-- تفعيل Row Level Security
ALTER TABLE public.incentive_rules ENABLE ROW LEVEL SECURITY;

-- السياسات: الجميع يمكنهم قراءة الحوافز المقررة
CREATE POLICY "Everyone can view active incentive rules" 
    ON public.incentive_rules 
    FOR SELECT 
    TO authenticated 
    USING (is_active = TRUE);

-- السياسات: المدراء فقط يمكنهم إضافة وتعديل الحوافز
CREATE POLICY "Managers can manage incentive rules" 
    ON public.incentive_rules 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() 
            AND employee_type_id IN (
                SELECT id FROM public.employee_types 
                WHERE name IN ('مدير قسم فني', 'مدير عام')
            )
        )
    );

-- Trigger لتحديث updated_at
CREATE TRIGGER update_incentive_rules_updated_at
    BEFORE UPDATE ON public.incentive_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إضافة الحوافز الافتراضية لكل نوع وظيفة

-- 1. موظف كول سنتر (101)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز استقبال المكالمات',
    50.00,
    'ثابت',
    'حافز شهري لاستقبال المكالمات وتسجيل بيانات العملاء',
    'يصرف في نهاية كل شهر'
FROM public.employee_types WHERE code_prefix = '101'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الأداء المتميز',
    100.00,
    'متغير',
    'حافز إضافي عند تحقيق أهداف معينة',
    'يصرف عند تحقيق 100+ مكالمة ناجحة شهرياً'
FROM public.employee_types WHERE code_prefix = '101'
ON CONFLICT DO NOTHING;

-- 2. موظف ريسبشن (201)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز استقبال العملاء',
    75.00,
    'ثابت',
    'حافز شهري لاستقبال العملاء وتسجيلهم',
    'يصرف في نهاية كل شهر'
FROM public.employee_types WHERE code_prefix = '201'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز خدمة العملاء المتميزة',
    150.00,
    'متغير',
    'حافز إضافي للخدمة المتميزة',
    'يصرف عند الحصول على تقييم 4.5+ من العملاء'
FROM public.employee_types WHERE code_prefix = '201'
ON CONFLICT DO NOTHING;

-- 3. سائق (301)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الرحلات',
    100.00,
    'ثابت',
    'حافز شهري لنقل الأجهزة والعملاء',
    'يصرف في نهاية كل شهر'
FROM public.employee_types WHERE code_prefix = '301'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الرحلات الإضافية',
    10.00,
    'متغير',
    'حافز عن كل رحلة إضافية',
    'يصرف عن كل رحلة تزيد عن 50 رحلة شهرياً'
FROM public.employee_types WHERE code_prefix = '301'
ON CONFLICT DO NOTHING;

-- 4. مندوب (401)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'عمولة المبيعات',
    5.00,
    'نسبة مئوية',
    'عمولة على كل عملية بيع',
    'يصرف 5% من قيمة كل عملية بيع'
FROM public.employee_types WHERE code_prefix = '401'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز تحقيق الهدف الشهري',
    500.00,
    'متغير',
    'حافز عند تحقيق هدف المبيعات الشهري',
    'يصرف عند تحقيق 50,000 جنيه مبيعات شهرياً'
FROM public.employee_types WHERE code_prefix = '401'
ON CONFLICT DO NOTHING;

-- 5. فني صيانة (501)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الصيانة',
    150.00,
    'ثابت',
    'حافز شهري لصيانة الأجهزة',
    'يصرف في نهاية كل شهر'
FROM public.employee_types WHERE code_prefix = '501'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الصيانات الإضافية',
    20.00,
    'متغير',
    'حافز عن كل صيانة إضافية',
    'يصرف عن كل صيانة تزيد عن 30 صيانة شهرياً'
FROM public.employee_types WHERE code_prefix = '501'
ON CONFLICT DO NOTHING;

-- 6. مدير قسم فني (601)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الإشراف',
    300.00,
    'ثابت',
    'حافز شهري للإشراف على القسم الفني',
    'يصرف في نهاية كل شهر'
FROM public.employee_types WHERE code_prefix = '601'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الأداء المتميز للقسم',
    500.00,
    'متغير',
    'حافز عند تحقيق أهداف القسم',
    'يصرف عند تحقيق 95%+ من أهداف القسم الشهرية'
FROM public.employee_types WHERE code_prefix = '601'
ON CONFLICT DO NOTHING;

-- 7. مدير عام (701)
INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز الإدارة',
    1000.00,
    'ثابت',
    'حافز شهري للإدارة العامة',
    'يصرف في نهاية كل شهر'
FROM public.employee_types WHERE code_prefix = '701'
ON CONFLICT DO NOTHING;

INSERT INTO public.incentive_rules (employee_type_id, incentive_name, incentive_amount, incentive_type, description, conditions)
SELECT 
    id,
    'حافز تحقيق الأهداف الاستراتيجية',
    2000.00,
    'متغير',
    'حافز عند تحقيق الأهداف الاستراتيجية للشركة',
    'يصرف ربع سنوي عند تحقيق الأهداف'
FROM public.employee_types WHERE code_prefix = '701'
ON CONFLICT DO NOTHING;

-- دالة لحساب إجمالي الحوافز المقررة لموظف
CREATE OR REPLACE FUNCTION get_employee_total_incentives(p_employee_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_employee_type_id UUID;
    v_total DECIMAL(10,2) := 0;
BEGIN
    -- الحصول على نوع الموظف
    SELECT employee_type_id INTO v_employee_type_id
    FROM public.employees
    WHERE id = p_employee_id;
    
    -- حساب مجموع الحوافز الثابتة فقط
    SELECT COALESCE(SUM(incentive_amount), 0) INTO v_total
    FROM public.incentive_rules
    WHERE employee_type_id = v_employee_type_id
    AND is_active = TRUE
    AND incentive_type = 'ثابت';
    
    RETURN v_total;
END;
$$;

COMMENT ON FUNCTION get_employee_total_incentives IS 'حساب إجمالي الحوافز الثابتة المقررة للموظف';

-- إضافة تعليقات توضيحية
COMMENT ON TABLE public.incentive_rules IS 'جدول الحوافز المقررة لكل نوع وظيفة';
COMMENT ON COLUMN public.incentive_rules.incentive_name IS 'اسم الحافز';
COMMENT ON COLUMN public.incentive_rules.incentive_amount IS 'قيمة الحافز بالجنيه المصري';
COMMENT ON COLUMN public.incentive_rules.incentive_type IS 'نوع الحافز: ثابت، متغير، أو نسبة مئوية';
COMMENT ON COLUMN public.incentive_rules.description IS 'وصف الحافز';
COMMENT ON COLUMN public.incentive_rules.conditions IS 'شروط صرف الحافز';
