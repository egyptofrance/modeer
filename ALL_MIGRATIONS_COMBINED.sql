-- Expand employee data with additional fields
-- Migration: 20251119000001_expand_employee_data
-- Status: APPLIED SUCCESSFULLY

-- إضافة الأعمدة الناقصة لجدول employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS qualification_level TEXT,
ADD COLUMN IF NOT EXISTS qualification_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS address_verified_date DATE,
ADD COLUMN IF NOT EXISTS application_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS initial_test_score INTEGER CHECK (initial_test_score >= 0 AND initial_test_score <= 100),
ADD COLUMN IF NOT EXISTS gender TEXT;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN public.employees.date_of_birth IS 'تاريخ ميلاد الموظف';
COMMENT ON COLUMN public.employees.qualification_level IS 'المؤهل الدراسي';
COMMENT ON COLUMN public.employees.qualification_name IS 'اسم المؤهل';
COMMENT ON COLUMN public.employees.address IS 'عنوان الموظف';
COMMENT ON COLUMN public.employees.address_verified IS 'هل تم إثبات العنوان';
COMMENT ON COLUMN public.employees.address_verified_date IS 'تاريخ إثبات العنوان';
COMMENT ON COLUMN public.employees.application_date IS 'تاريخ التقدم للوظيفة';
COMMENT ON COLUMN public.employees.initial_test_score IS 'سكور اختبار التقدم';
COMMENT ON COLUMN public.employees.gender IS 'الجنس';

-- دالة حساب الراتب اليومي
CREATE OR REPLACE FUNCTION calculate_daily_salary(p_employee_id UUID)
RETURNS DECIMAL(10,2) LANGUAGE plpgsql AS $$
DECLARE v_base_salary DECIMAL(10,2);
BEGIN
  SELECT base_salary INTO v_base_salary FROM public.employees WHERE id = p_employee_id;
  RETURN COALESCE(v_base_salary / 30, 0);
END; $$;

COMMENT ON FUNCTION calculate_daily_salary IS 'حساب الراتب اليومي للموظف';

-- دالة التحقق من أهلية الإجازات (بعد 6 شهور)
CREATE OR REPLACE FUNCTION is_eligible_for_leave(p_employee_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_hire_date DATE; v_months INTEGER;
BEGIN
  SELECT hire_date INTO v_hire_date FROM public.employees WHERE id = p_employee_id;
  v_months := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_hire_date));
  RETURN v_months >= 6;
END; $$;

COMMENT ON FUNCTION is_eligible_for_leave IS 'التحقق من أهلية الموظف للإجازات (بعد 6 شهور من التعيين)';
-- Employee Documents System
-- Migration: 20251119000002_employee_documents
-- Phase 2: Document Management System

-- إنشاء جدول المستندات
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- المستندات المطلوبة
    id_card_front TEXT,  -- رابط صورة البطاقة وجه
    id_card_back TEXT,   -- رابط صورة البطاقة ظهر
    utility_bill TEXT,   -- رابط إيصال مرافق (كهرباء/مياه/غاز)
    birth_certificate TEXT,  -- رابط شهادة الميلاد
    qualification_certificate TEXT,  -- رابط المؤهل الدراسي
    military_certificate TEXT,  -- رابط شهادة التجنيد (للذكور فقط)
    application_form TEXT,  -- رابط صورة Application
    
    -- حالة المستندات
    documents_complete BOOLEAN DEFAULT FALSE,
    documents_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- ملاحظات
    notes TEXT,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_complete ON public.employee_documents(documents_complete);
CREATE INDEX IF NOT EXISTS idx_employee_documents_verified ON public.employee_documents(documents_verified);

-- تفعيل Row Level Security
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- السياسات: الموظفون يمكنهم رؤية مستنداتهم فقط
CREATE POLICY "Employees can view their own documents" 
    ON public.employee_documents 
    FOR SELECT 
    TO authenticated 
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- السياسات: الموظفون يمكنهم رفع مستنداتهم
CREATE POLICY "Employees can upload their own documents" 
    ON public.employee_documents 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- السياسات: الموظفون يمكنهم تحديث مستنداتهم
CREATE POLICY "Employees can update their own documents" 
    ON public.employee_documents 
    FOR UPDATE 
    TO authenticated 
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- السياسات: المدراء يمكنهم رؤية كل المستندات
CREATE POLICY "Managers can view all documents" 
    ON public.employee_documents 
    FOR SELECT 
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

-- السياسات: المدراء يمكنهم التحقق من المستندات
CREATE POLICY "Managers can verify documents" 
    ON public.employee_documents 
    FOR UPDATE 
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
CREATE TRIGGER update_employee_documents_updated_at
    BEFORE UPDATE ON public.employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- دالة للتحقق من اكتمال المستندات
CREATE OR REPLACE FUNCTION check_documents_complete(p_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_gender TEXT;
    v_docs RECORD;
    v_complete BOOLEAN := TRUE;
BEGIN
    -- الحصول على جنس الموظف
    SELECT gender INTO v_gender
    FROM public.employees
    WHERE id = p_employee_id;
    
    -- الحصول على المستندات
    SELECT * INTO v_docs
    FROM public.employee_documents
    WHERE employee_id = p_employee_id;
    
    -- التحقق من المستندات الأساسية
    IF v_docs.id_card_front IS NULL OR v_docs.id_card_back IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.utility_bill IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.birth_certificate IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.qualification_certificate IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.application_form IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    -- التحقق من شهادة التجنيد للذكور فقط
    IF v_gender = 'ذكر' AND v_docs.military_certificate IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    RETURN v_complete;
END;
$$;

COMMENT ON FUNCTION check_documents_complete IS 'التحقق من اكتمال مستندات الموظف';

-- دالة لتحديث حالة اكتمال المستندات تلقائياً
CREATE OR REPLACE FUNCTION auto_update_documents_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.documents_complete := check_documents_complete(NEW.employee_id);
    RETURN NEW;
END;
$$;

-- Trigger لتحديث حالة الاكتمال تلقائياً
CREATE TRIGGER auto_update_documents_complete_trigger
    BEFORE INSERT OR UPDATE ON public.employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_documents_complete();

-- إضافة تعليقات توضيحية
COMMENT ON TABLE public.employee_documents IS 'جدول مستندات الموظفين';
COMMENT ON COLUMN public.employee_documents.id_card_front IS 'صورة البطاقة الشخصية - الوجه';
COMMENT ON COLUMN public.employee_documents.id_card_back IS 'صورة البطاقة الشخصية - الظهر';
COMMENT ON COLUMN public.employee_documents.utility_bill IS 'إيصال مرافق (كهرباء/مياه/غاز) لإثبات العنوان';
COMMENT ON COLUMN public.employee_documents.birth_certificate IS 'شهادة الميلاد';
COMMENT ON COLUMN public.employee_documents.qualification_certificate IS 'شهادة المؤهل الدراسي';
COMMENT ON COLUMN public.employee_documents.military_certificate IS 'شهادة التجنيد أو الإعفاء (للذكور فقط)';
COMMENT ON COLUMN public.employee_documents.application_form IS 'صورة من Application التقديم للوظيفة';
COMMENT ON COLUMN public.employee_documents.documents_complete IS 'هل جميع المستندات المطلوبة مكتملة';
COMMENT ON COLUMN public.employee_documents.documents_verified IS 'هل تم التحقق من المستندات من قبل المدير';
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
-- Orientations and Tests System
-- Migration: 20251119000004_orientations_and_tests
-- Phase 4: Employee Orientations and Tests Management

-- ========================================
-- 1. جدول التوجيهات
-- ========================================
CREATE TABLE IF NOT EXISTS public.employee_orientations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- بيانات التوجيه
    orientation_title TEXT NOT NULL,
    orientation_description TEXT,
    orientation_type TEXT CHECK (orientation_type IN ('تعريف بالشركة', 'سياسات العمل', 'الأمن والسلامة', 'تدريب فني', 'أخرى')),
    
    -- المدة والتاريخ
    duration_hours DECIMAL(5,2),
    orientation_date DATE NOT NULL,
    
    -- المسؤول عن التوجيه
    conducted_by UUID REFERENCES auth.users(id),
    conducted_by_name TEXT,
    
    -- الحالة
    status TEXT DEFAULT 'مكتمل' CHECK (status IN ('مجدول', 'جاري', 'مكتمل', 'ملغي')),
    completion_percentage INTEGER DEFAULT 100 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- ملاحظات
    notes TEXT,
    attachments TEXT[], -- روابط المستندات المرفقة
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. جدول الاختبارات
-- ========================================
CREATE TABLE IF NOT EXISTS public.employee_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- بيانات الاختبار
    test_title TEXT NOT NULL,
    test_description TEXT,
    test_type TEXT CHECK (test_type IN ('اختبار تقييم', 'اختبار دوري', 'اختبار ترقية', 'اختبار فني', 'أخرى')),
    
    -- الدرجات
    total_score INTEGER NOT NULL DEFAULT 100,
    obtained_score INTEGER NOT NULL DEFAULT 0,
    passing_score INTEGER NOT NULL DEFAULT 60,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS ((obtained_score::DECIMAL / total_score::DECIMAL) * 100) STORED,
    
    -- الحالة
    status TEXT DEFAULT 'مجدول' CHECK (status IN ('مجدول', 'جاري', 'مكتمل', 'ملغي')),
    passed BOOLEAN GENERATED ALWAYS AS (obtained_score >= passing_score) STORED,
    
    -- التاريخ
    test_date DATE NOT NULL,
    completion_date DATE,
    
    -- المسؤول عن الاختبار
    conducted_by UUID REFERENCES auth.users(id),
    conducted_by_name TEXT,
    
    -- ملاحظات
    notes TEXT,
    feedback TEXT,
    attachments TEXT[],
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_orientations_employee_id ON public.employee_orientations(employee_id);
CREATE INDEX IF NOT EXISTS idx_orientations_date ON public.employee_orientations(orientation_date);
CREATE INDEX IF NOT EXISTS idx_orientations_status ON public.employee_orientations(status);

CREATE INDEX IF NOT EXISTS idx_tests_employee_id ON public.employee_tests(employee_id);
CREATE INDEX IF NOT EXISTS idx_tests_date ON public.employee_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.employee_tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_passed ON public.employee_tests(passed);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.employee_orientations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_tests ENABLE ROW LEVEL SECURITY;

-- السياسات: الموظفون يمكنهم رؤية توجيهاتهم واختباراتهم
CREATE POLICY "Employees can view their own orientations" 
    ON public.employee_orientations FOR SELECT TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view their own tests" 
    ON public.employee_tests FOR SELECT TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- السياسات: المدراء يمكنهم إدارة كل التوجيهات والاختبارات
CREATE POLICY "Managers can manage all orientations" 
    ON public.employee_orientations FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

CREATE POLICY "Managers can manage all tests" 
    ON public.employee_tests FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

-- ========================================
-- Triggers
-- ========================================
CREATE TRIGGER update_orientations_updated_at
    BEFORE UPDATE ON public.employee_orientations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
    BEFORE UPDATE ON public.employee_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Functions
-- ========================================

-- دالة لحساب عدد التوجيهات المكتملة للموظف
CREATE OR REPLACE FUNCTION get_employee_completed_orientations_count(p_employee_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.employee_orientations
    WHERE employee_id = p_employee_id
    AND status = 'مكتمل';
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- دالة لحساب متوسط درجات الاختبارات للموظف
CREATE OR REPLACE FUNCTION get_employee_average_test_score(p_employee_id UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_average DECIMAL(5,2);
BEGIN
    SELECT AVG(percentage) INTO v_average
    FROM public.employee_tests
    WHERE employee_id = p_employee_id
    AND status = 'مكتمل';
    
    RETURN COALESCE(v_average, 0);
END;
$$;

-- دالة لحساب عدد الاختبارات الناجحة للموظف
CREATE OR REPLACE FUNCTION get_employee_passed_tests_count(p_employee_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.employee_tests
    WHERE employee_id = p_employee_id
    AND status = 'مكتمل'
    AND passed = TRUE;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- دالة لحساب عدد الاختبارات الفاشلة للموظف
CREATE OR REPLACE FUNCTION get_employee_failed_tests_count(p_employee_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.employee_tests
    WHERE employee_id = p_employee_id
    AND status = 'مكتمل'
    AND passed = FALSE;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- دالة للحصول على تقرير شامل عن التوجيهات والاختبارات للموظف
CREATE OR REPLACE FUNCTION get_employee_training_report(p_employee_id UUID)
RETURNS TABLE (
    total_orientations INTEGER,
    completed_orientations INTEGER,
    total_tests INTEGER,
    passed_tests INTEGER,
    failed_tests INTEGER,
    average_score DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.employee_orientations WHERE employee_id = p_employee_id),
        (SELECT COUNT(*)::INTEGER FROM public.employee_orientations WHERE employee_id = p_employee_id AND status = 'مكتمل'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_tests WHERE employee_id = p_employee_id AND status = 'مكتمل'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_tests WHERE employee_id = p_employee_id AND status = 'مكتمل' AND passed = TRUE),
        (SELECT COUNT(*)::INTEGER FROM public.employee_tests WHERE employee_id = p_employee_id AND status = 'مكتمل' AND passed = FALSE),
        (SELECT COALESCE(AVG(percentage), 0)::DECIMAL(5,2) FROM public.employee_tests WHERE employee_id = p_employee_id AND status = 'مكتمل');
END;
$$;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE public.employee_orientations IS 'جدول توجيهات الموظفين والتدريبات';
COMMENT ON TABLE public.employee_tests IS 'جدول اختبارات الموظفين ودرجاتهم';

COMMENT ON COLUMN public.employee_orientations.orientation_title IS 'عنوان التوجيه';
COMMENT ON COLUMN public.employee_orientations.orientation_type IS 'نوع التوجيه';
COMMENT ON COLUMN public.employee_orientations.duration_hours IS 'مدة التوجيه بالساعات';
COMMENT ON COLUMN public.employee_orientations.status IS 'حالة التوجيه';

COMMENT ON COLUMN public.employee_tests.test_title IS 'عنوان الاختبار';
COMMENT ON COLUMN public.employee_tests.test_type IS 'نوع الاختبار';
COMMENT ON COLUMN public.employee_tests.total_score IS 'الدرجة الكلية للاختبار';
COMMENT ON COLUMN public.employee_tests.obtained_score IS 'الدرجة المحصلة';
COMMENT ON COLUMN public.employee_tests.passing_score IS 'درجة النجاح';
COMMENT ON COLUMN public.employee_tests.percentage IS 'النسبة المئوية (محسوبة تلقائياً)';
COMMENT ON COLUMN public.employee_tests.passed IS 'هل نجح في الاختبار (محسوب تلقائياً)';

COMMENT ON FUNCTION get_employee_completed_orientations_count IS 'حساب عدد التوجيهات المكتملة للموظف';
COMMENT ON FUNCTION get_employee_average_test_score IS 'حساب متوسط درجات الاختبارات للموظف';
COMMENT ON FUNCTION get_employee_passed_tests_count IS 'حساب عدد الاختبارات الناجحة للموظف';
COMMENT ON FUNCTION get_employee_failed_tests_count IS 'حساب عدد الاختبارات الفاشلة للموظف';
COMMENT ON FUNCTION get_employee_training_report IS 'الحصول على تقرير شامل عن التوجيهات والاختبارات للموظف';
-- Penalties and Deductions System
-- Migration: 20251119000005_penalties_and_deductions
-- Phase 5: Employee Penalties and Deductions Management

-- ========================================
-- جدول العقوبات والخصومات
-- ========================================
CREATE TABLE IF NOT EXISTS public.employee_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- نوع العقوبة
    penalty_type TEXT NOT NULL CHECK (penalty_type IN (
        'تأخير',
        'غياب بدون إذن',
        'خطأ في العمل',
        'إهمال',
        'مخالفة سلوكية',
        'عدم الالتزام بالزي',
        'استخدام الهاتف',
        'تأخر في التسليم',
        'أخرى'
    )),
    
    -- المبلغ والتفاصيل
    deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    penalty_title TEXT NOT NULL,
    penalty_description TEXT,
    
    -- التاريخ والوقت
    incident_date DATE NOT NULL,
    incident_time TIME,
    applied_date DATE DEFAULT CURRENT_DATE,
    
    -- من قام بتطبيق العقوبة
    applied_by UUID REFERENCES auth.users(id) NOT NULL,
    applied_by_name TEXT,
    
    -- الحالة
    status TEXT DEFAULT 'مطبقة' CHECK (status IN ('مقترحة', 'مطبقة', 'ملغاة', 'معلقة')),
    
    -- الموافقة
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- ملاحظات
    notes TEXT,
    employee_response TEXT,
    attachments TEXT[],
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- جدول قواعد الخصومات الافتراضية
-- ========================================
CREATE TABLE IF NOT EXISTS public.penalty_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- نوع المخالفة
    penalty_type TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    
    -- المبلغ
    default_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    calculation_method TEXT CHECK (calculation_method IN ('مبلغ ثابت', 'نسبة من الراتب', 'حسب المدة')),
    
    -- الوصف
    description TEXT,
    
    -- الحالة
    is_active BOOLEAN DEFAULT TRUE,
    requires_manager_approval BOOLEAN DEFAULT FALSE,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_penalties_employee_id ON public.employee_penalties(employee_id);
CREATE INDEX IF NOT EXISTS idx_penalties_type ON public.employee_penalties(penalty_type);
CREATE INDEX IF NOT EXISTS idx_penalties_date ON public.employee_penalties(incident_date);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON public.employee_penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_applied_by ON public.employee_penalties(applied_by);

CREATE INDEX IF NOT EXISTS idx_penalty_rules_type ON public.penalty_rules(penalty_type);
CREATE INDEX IF NOT EXISTS idx_penalty_rules_active ON public.penalty_rules(is_active);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.employee_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalty_rules ENABLE ROW LEVEL SECURITY;

-- السياسات: الموظفون يمكنهم رؤية عقوباتهم فقط
CREATE POLICY "Employees can view their own penalties" 
    ON public.employee_penalties FOR SELECT TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- السياسات: الموظفون يمكنهم إضافة رد على العقوبة
CREATE POLICY "Employees can respond to their penalties" 
    ON public.employee_penalties FOR UPDATE TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- السياسات: المدراء يمكنهم إدارة كل العقوبات
CREATE POLICY "Managers can manage all penalties" 
    ON public.employee_penalties FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

-- السياسات: الجميع يمكنهم رؤية قواعد الخصومات
CREATE POLICY "Everyone can view penalty rules" 
    ON public.penalty_rules FOR SELECT TO authenticated 
    USING (is_active = TRUE);

-- السياسات: المدراء فقط يمكنهم تعديل قواعد الخصومات
CREATE POLICY "Managers can manage penalty rules" 
    ON public.penalty_rules FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

-- ========================================
-- Triggers
-- ========================================
CREATE TRIGGER update_penalties_updated_at
    BEFORE UPDATE ON public.employee_penalties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalty_rules_updated_at
    BEFORE UPDATE ON public.penalty_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- إضافة قواعد خصومات افتراضية
-- ========================================

-- تأخير
INSERT INTO public.penalty_rules (penalty_type, rule_name, default_amount, calculation_method, description, requires_manager_approval) VALUES
('تأخير', 'تأخير أقل من 15 دقيقة', 10.00, 'مبلغ ثابت', 'خصم 10 جنيه عن كل تأخير أقل من 15 دقيقة', FALSE),
('تأخير', 'تأخير من 15-30 دقيقة', 25.00, 'مبلغ ثابت', 'خصم 25 جنيه عن التأخير من 15 إلى 30 دقيقة', FALSE),
('تأخير', 'تأخير أكثر من 30 دقيقة', 50.00, 'مبلغ ثابت', 'خصم 50 جنيه عن التأخير أكثر من 30 دقيقة', TRUE);

-- غياب
INSERT INTO public.penalty_rules (penalty_type, rule_name, default_amount, calculation_method, description, requires_manager_approval) VALUES
('غياب بدون إذن', 'غياب يوم واحد', 100.00, 'مبلغ ثابت', 'خصم 100 جنيه عن كل يوم غياب بدون إذن', TRUE),
('غياب بدون إذن', 'غياب متكرر (3 أيام)', 500.00, 'مبلغ ثابت', 'خصم 500 جنيه عند الغياب 3 أيام متكررة', TRUE);

-- أخطاء في العمل
INSERT INTO public.penalty_rules (penalty_type, rule_name, default_amount, calculation_method, description, requires_manager_approval) VALUES
('خطأ في العمل', 'خطأ بسيط', 20.00, 'مبلغ ثابت', 'خصم 20 جنيه عن الأخطاء البسيطة في العمل', FALSE),
('خطأ في العمل', 'خطأ متوسط', 50.00, 'مبلغ ثابت', 'خصم 50 جنيه عن الأخطاء المتوسطة', TRUE),
('خطأ في العمل', 'خطأ جسيم', 200.00, 'مبلغ ثابت', 'خصم 200 جنيه عن الأخطاء الجسيمة', TRUE);

-- إهمال
INSERT INTO public.penalty_rules (penalty_type, rule_name, default_amount, calculation_method, description, requires_manager_approval) VALUES
('إهمال', 'إهمال في المهام', 30.00, 'مبلغ ثابت', 'خصم 30 جنيه عن الإهمال في أداء المهام', TRUE);

-- مخالفات سلوكية
INSERT INTO public.penalty_rules (penalty_type, rule_name, default_amount, calculation_method, description, requires_manager_approval) VALUES
('مخالفة سلوكية', 'سوء سلوك مع زميل', 100.00, 'مبلغ ثابت', 'خصم 100 جنيه عن سوء السلوك مع الزملاء', TRUE),
('مخالفة سلوكية', 'سوء سلوك مع عميل', 200.00, 'مبلغ ثابت', 'خصم 200 جنيه عن سوء السلوك مع العملاء', TRUE);

-- مخالفات أخرى
INSERT INTO public.penalty_rules (penalty_type, rule_name, default_amount, calculation_method, description, requires_manager_approval) VALUES
('عدم الالتزام بالزي', 'عدم ارتداء الزي الرسمي', 15.00, 'مبلغ ثابت', 'خصم 15 جنيه عن عدم الالتزام بالزي الرسمي', FALSE),
('استخدام الهاتف', 'استخدام الهاتف أثناء العمل', 25.00, 'مبلغ ثابت', 'خصم 25 جنيه عن استخدام الهاتف الشخصي أثناء العمل', FALSE),
('تأخر في التسليم', 'تأخر في تسليم المهام', 50.00, 'مبلغ ثابت', 'خصم 50 جنيه عن التأخر في تسليم المهام', TRUE);

-- ========================================
-- Functions
-- ========================================

-- دالة لحساب إجمالي الخصومات للموظف في شهر معين
CREATE OR REPLACE FUNCTION get_employee_monthly_penalties(
    p_employee_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(deduction_amount), 0) INTO v_total
    FROM public.employee_penalties
    WHERE employee_id = p_employee_id
    AND status = 'مطبقة'
    AND EXTRACT(YEAR FROM incident_date) = p_year
    AND EXTRACT(MONTH FROM incident_date) = p_month;
    
    RETURN v_total;
END;
$$;

-- دالة لحساب إجمالي الخصومات للموظف (كل الوقت)
CREATE OR REPLACE FUNCTION get_employee_total_penalties(p_employee_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(deduction_amount), 0) INTO v_total
    FROM public.employee_penalties
    WHERE employee_id = p_employee_id
    AND status = 'مطبقة';
    
    RETURN v_total;
END;
$$;

-- دالة لحساب عدد العقوبات حسب النوع
CREATE OR REPLACE FUNCTION get_employee_penalties_by_type(
    p_employee_id UUID,
    p_penalty_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.employee_penalties
    WHERE employee_id = p_employee_id
    AND penalty_type = p_penalty_type
    AND status = 'مطبقة';
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- دالة للحصول على تقرير شامل عن العقوبات للموظف
CREATE OR REPLACE FUNCTION get_employee_penalties_report(p_employee_id UUID)
RETURNS TABLE (
    total_penalties INTEGER,
    total_deductions DECIMAL(10,2),
    late_count INTEGER,
    absence_count INTEGER,
    error_count INTEGER,
    last_penalty_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.employee_penalties WHERE employee_id = p_employee_id AND status = 'مطبقة'),
        (SELECT COALESCE(SUM(deduction_amount), 0)::DECIMAL(10,2) FROM public.employee_penalties WHERE employee_id = p_employee_id AND status = 'مطبقة'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_penalties WHERE employee_id = p_employee_id AND penalty_type = 'تأخير' AND status = 'مطبقة'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_penalties WHERE employee_id = p_employee_id AND penalty_type = 'غياب بدون إذن' AND status = 'مطبقة'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_penalties WHERE employee_id = p_employee_id AND penalty_type = 'خطأ في العمل' AND status = 'مطبقة'),
        (SELECT MAX(incident_date) FROM public.employee_penalties WHERE employee_id = p_employee_id AND status = 'مطبقة');
END;
$$;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE public.employee_penalties IS 'جدول عقوبات وخصومات الموظفين';
COMMENT ON TABLE public.penalty_rules IS 'جدول قواعد الخصومات الافتراضية';

COMMENT ON COLUMN public.employee_penalties.penalty_type IS 'نوع العقوبة';
COMMENT ON COLUMN public.employee_penalties.deduction_amount IS 'مبلغ الخصم بالجنيه المصري';
COMMENT ON COLUMN public.employee_penalties.incident_date IS 'تاريخ حدوث المخالفة';
COMMENT ON COLUMN public.employee_penalties.applied_date IS 'تاريخ تطبيق العقوبة';
COMMENT ON COLUMN public.employee_penalties.status IS 'حالة العقوبة';
COMMENT ON COLUMN public.employee_penalties.requires_approval IS 'هل تحتاج موافقة من مدير أعلى';

COMMENT ON FUNCTION get_employee_monthly_penalties IS 'حساب إجمالي الخصومات للموظف في شهر معين';
COMMENT ON FUNCTION get_employee_total_penalties IS 'حساب إجمالي الخصومات للموظف (كل الوقت)';
COMMENT ON FUNCTION get_employee_penalties_by_type IS 'حساب عدد العقوبات حسب النوع';
COMMENT ON FUNCTION get_employee_penalties_report IS 'الحصول على تقرير شامل عن العقوبات للموظف';
-- Leave Management System
-- Migration: 20251119000006_leave_system
-- Phase 6: Employee Leave Requests (Available after 6 months of employment)

-- ========================================
-- جدول طلبات الإجازات
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- نوع الإجازة
    leave_type TEXT NOT NULL CHECK (leave_type IN (
        'إجازة سنوية',
        'إجازة مرضية',
        'إجازة طارئة',
        'إجازة بدون راتب',
        'إجازة رسمية',
        'أخرى'
    )),
    
    -- التواريخ
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    
    -- السبب
    reason TEXT NOT NULL,
    notes TEXT,
    attachments TEXT[], -- مستندات مثل تقرير طبي
    
    -- الحالة
    status TEXT DEFAULT 'قيد المراجعة' CHECK (status IN (
        'قيد المراجعة',
        'موافق عليها',
        'مرفوضة',
        'ملغاة'
    )),
    
    -- المراجعة والموافقة
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_by_name TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- قيود
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT positive_days CHECK (days_count > 0)
);

-- ========================================
-- جدول رصيد الإجازات
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- رصيد الإجازات السنوية
    annual_leave_total INTEGER DEFAULT 21, -- 21 يوم سنوياً
    annual_leave_used INTEGER DEFAULT 0,
    annual_leave_remaining INTEGER GENERATED ALWAYS AS (annual_leave_total - annual_leave_used) STORED,
    
    -- رصيد الإجازات المرضية
    sick_leave_total INTEGER DEFAULT 15, -- 15 يوم سنوياً
    sick_leave_used INTEGER DEFAULT 0,
    sick_leave_remaining INTEGER GENERATED ALWAYS AS (sick_leave_total - sick_leave_used) STORED,
    
    -- رصيد الإجازات الطارئة
    emergency_leave_total INTEGER DEFAULT 7, -- 7 أيام سنوياً
    emergency_leave_used INTEGER DEFAULT 0,
    emergency_leave_remaining INTEGER GENERATED ALWAYS AS (emergency_leave_total - emergency_leave_used) STORED,
    
    -- السنة
    year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON public.leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_leave_balance_employee_id ON public.leave_balance(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_year ON public.leave_balance(year);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balance ENABLE ROW LEVEL SECURITY;

-- السياسات: الموظفون يمكنهم رؤية طلباتهم ورصيدهم
CREATE POLICY "Employees can view their own leave requests" 
    ON public.leave_requests FOR SELECT TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view their own leave balance" 
    ON public.leave_balance FOR SELECT TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- السياسات: الموظفون يمكنهم إنشاء طلبات إجازة
CREATE POLICY "Employees can create leave requests" 
    ON public.leave_requests FOR INSERT TO authenticated 
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- السياسات: الموظفون يمكنهم إلغاء طلباتهم
CREATE POLICY "Employees can cancel their leave requests" 
    ON public.leave_requests FOR UPDATE TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) AND status = 'قيد المراجعة');

-- السياسات: المدراء يمكنهم إدارة كل الطلبات
CREATE POLICY "Managers can manage all leave requests" 
    ON public.leave_requests FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

CREATE POLICY "Managers can view all leave balances" 
    ON public.leave_balance FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

-- ========================================
-- Triggers
-- ========================================
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balance_updated_at
    BEFORE UPDATE ON public.leave_balance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Functions
-- ========================================

-- دالة للتحقق من أهلية الموظف للإجازات (بعد 6 شهور)
-- (هذه الدالة موجودة بالفعل من Phase 1، لكن سنعيد تعريفها للتأكد)
CREATE OR REPLACE FUNCTION is_eligible_for_leave(p_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_hire_date DATE;
    v_months_worked INTEGER;
BEGIN
    SELECT hire_date INTO v_hire_date
    FROM public.employees
    WHERE id = p_employee_id;
    
    IF v_hire_date IS NULL THEN
        RETURN FALSE;
    END IF;
    
    v_months_worked := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_hire_date)) * 12 
                     + EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_hire_date));
    
    RETURN v_months_worked >= 6;
END;
$$;

-- دالة لإنشاء رصيد إجازات للموظف الجديد
CREATE OR REPLACE FUNCTION create_leave_balance_for_employee(p_employee_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.leave_balance (employee_id, year)
    VALUES (p_employee_id, EXTRACT(YEAR FROM CURRENT_DATE))
    ON CONFLICT (employee_id) DO NOTHING;
END;
$$;

-- دالة لتحديث رصيد الإجازات عند الموافقة على طلب
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- فقط عند تغيير الحالة إلى "موافق عليها"
    IF NEW.status = 'موافق عليها' AND OLD.status != 'موافق عليها' THEN
        -- تحديث الرصيد حسب نوع الإجازة
        IF NEW.leave_type = 'إجازة سنوية' THEN
            UPDATE public.leave_balance
            SET annual_leave_used = annual_leave_used + NEW.days_count
            WHERE employee_id = NEW.employee_id
            AND year = EXTRACT(YEAR FROM NEW.start_date);
            
        ELSIF NEW.leave_type = 'إجازة مرضية' THEN
            UPDATE public.leave_balance
            SET sick_leave_used = sick_leave_used + NEW.days_count
            WHERE employee_id = NEW.employee_id
            AND year = EXTRACT(YEAR FROM NEW.start_date);
            
        ELSIF NEW.leave_type = 'إجازة طارئة' THEN
            UPDATE public.leave_balance
            SET emergency_leave_used = emergency_leave_used + NEW.days_count
            WHERE employee_id = NEW.employee_id
            AND year = EXTRACT(YEAR FROM NEW.start_date);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger لتحديث الرصيد تلقائياً
CREATE TRIGGER update_leave_balance_trigger
    AFTER UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance_on_approval();

-- دالة للحصول على رصيد الإجازات للموظف
CREATE OR REPLACE FUNCTION get_employee_leave_balance(p_employee_id UUID)
RETURNS TABLE (
    annual_total INTEGER,
    annual_used INTEGER,
    annual_remaining INTEGER,
    sick_total INTEGER,
    sick_used INTEGER,
    sick_remaining INTEGER,
    emergency_total INTEGER,
    emergency_used INTEGER,
    emergency_remaining INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lb.annual_leave_total,
        lb.annual_leave_used,
        lb.annual_leave_remaining,
        lb.sick_leave_total,
        lb.sick_leave_used,
        lb.sick_leave_remaining,
        lb.emergency_leave_total,
        lb.emergency_leave_used,
        lb.emergency_leave_remaining
    FROM public.leave_balance lb
    WHERE lb.employee_id = p_employee_id
    AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$;

-- دالة للحصول على إحصائيات الإجازات للموظف
CREATE OR REPLACE FUNCTION get_employee_leave_stats(p_employee_id UUID)
RETURNS TABLE (
    total_requests INTEGER,
    approved_requests INTEGER,
    rejected_requests INTEGER,
    pending_requests INTEGER,
    total_days_taken INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.leave_requests WHERE employee_id = p_employee_id),
        (SELECT COUNT(*)::INTEGER FROM public.leave_requests WHERE employee_id = p_employee_id AND status = 'موافق عليها'),
        (SELECT COUNT(*)::INTEGER FROM public.leave_requests WHERE employee_id = p_employee_id AND status = 'مرفوضة'),
        (SELECT COUNT(*)::INTEGER FROM public.leave_requests WHERE employee_id = p_employee_id AND status = 'قيد المراجعة'),
        (SELECT COALESCE(SUM(days_count), 0)::INTEGER FROM public.leave_requests WHERE employee_id = p_employee_id AND status = 'موافق عليها');
END;
$$;

-- دالة للتحقق من تعارض الإجازات
CREATE OR REPLACE FUNCTION check_leave_conflict(
    p_employee_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.leave_requests
    WHERE employee_id = p_employee_id
    AND status IN ('قيد المراجعة', 'موافق عليها')
    AND (
        (start_date <= p_end_date AND end_date >= p_start_date)
    );
    
    RETURN v_conflict_count > 0;
END;
$$;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE public.leave_requests IS 'جدول طلبات الإجازات';
COMMENT ON TABLE public.leave_balance IS 'جدول رصيد الإجازات السنوي لكل موظف';

COMMENT ON COLUMN public.leave_requests.leave_type IS 'نوع الإجازة';
COMMENT ON COLUMN public.leave_requests.days_count IS 'عدد أيام الإجازة (محسوب تلقائياً)';
COMMENT ON COLUMN public.leave_requests.status IS 'حالة الطلب';

COMMENT ON COLUMN public.leave_balance.annual_leave_total IS 'إجمالي الإجازات السنوية (21 يوم)';
COMMENT ON COLUMN public.leave_balance.annual_leave_remaining IS 'الرصيد المتبقي (محسوب تلقائياً)';

COMMENT ON FUNCTION is_eligible_for_leave IS 'التحقق من أهلية الموظف للإجازات (بعد 6 شهور)';
COMMENT ON FUNCTION get_employee_leave_balance IS 'الحصول على رصيد الإجازات للموظف';
COMMENT ON FUNCTION get_employee_leave_stats IS 'الحصول على إحصائيات الإجازات للموظف';
COMMENT ON FUNCTION check_leave_conflict IS 'التحقق من تعارض الإجازات';
-- Monthly Evaluation System
-- Migration: 20251119000007_monthly_evaluation
-- Phase 7: Employee Monthly Performance Evaluation

-- ========================================
-- جدول التقييمات الشهرية
-- ========================================
CREATE TABLE IF NOT EXISTS public.employee_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- الشهر والسنة
    evaluation_month INTEGER NOT NULL CHECK (evaluation_month >= 1 AND evaluation_month <= 12),
    evaluation_year INTEGER NOT NULL,
    
    -- معايير التقييم (من 1 إلى 5)
    performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 5),
    commitment_score INTEGER CHECK (commitment_score >= 1 AND commitment_score <= 5),
    customer_service_score INTEGER CHECK (customer_service_score >= 1 AND customer_service_score <= 5),
    teamwork_score INTEGER CHECK (teamwork_score >= 1 AND teamwork_score <= 5),
    innovation_score INTEGER CHECK (innovation_score >= 1 AND innovation_score <= 5),
    
    -- المتوسط (محسوب تلقائياً)
    average_score DECIMAL(3,2) GENERATED ALWAYS AS (
        (COALESCE(performance_score, 0) + 
         COALESCE(commitment_score, 0) + 
         COALESCE(customer_service_score, 0) + 
         COALESCE(teamwork_score, 0) + 
         COALESCE(innovation_score, 0))::DECIMAL / 5
    ) STORED,
    
    -- التقدير (محسوب تلقائياً)
    grade TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN ((COALESCE(performance_score, 0) + COALESCE(commitment_score, 0) + COALESCE(customer_service_score, 0) + COALESCE(teamwork_score, 0) + COALESCE(innovation_score, 0))::DECIMAL / 5) >= 4.5 THEN 'ممتاز'
            WHEN ((COALESCE(performance_score, 0) + COALESCE(commitment_score, 0) + COALESCE(customer_service_score, 0) + COALESCE(teamwork_score, 0) + COALESCE(innovation_score, 0))::DECIMAL / 5) >= 3.5 THEN 'جيد جداً'
            WHEN ((COALESCE(performance_score, 0) + COALESCE(commitment_score, 0) + COALESCE(customer_service_score, 0) + COALESCE(teamwork_score, 0) + COALESCE(innovation_score, 0))::DECIMAL / 5) >= 2.5 THEN 'جيد'
            WHEN ((COALESCE(performance_score, 0) + COALESCE(commitment_score, 0) + COALESCE(customer_service_score, 0) + COALESCE(teamwork_score, 0) + COALESCE(innovation_score, 0))::DECIMAL / 5) >= 1.5 THEN 'مقبول'
            ELSE 'ضعيف'
        END
    ) STORED,
    
    -- التعليقات
    strengths TEXT,
    weaknesses TEXT,
    improvement_suggestions TEXT,
    manager_comments TEXT,
    
    -- من قام بالتقييم
    evaluated_by UUID REFERENCES auth.users(id) NOT NULL,
    evaluated_by_name TEXT,
    
    -- الحالة
    status TEXT DEFAULT 'مكتمل' CHECK (status IN ('مسودة', 'مكتمل', 'معتمد')),
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- قيد فريد: تقييم واحد لكل موظف في كل شهر
    UNIQUE(employee_id, evaluation_year, evaluation_month)
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_evaluations_employee_id ON public.employee_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON public.employee_evaluations(evaluation_year, evaluation_month);
CREATE INDEX IF NOT EXISTS idx_evaluations_average ON public.employee_evaluations(average_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_grade ON public.employee_evaluations(grade);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON public.employee_evaluations(status);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.employee_evaluations ENABLE ROW LEVEL SECURITY;

-- السياسات: الموظفون يمكنهم رؤية تقييماتهم فقط
CREATE POLICY "Employees can view their own evaluations" 
    ON public.employee_evaluations FOR SELECT TO authenticated 
    USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- السياسات: المدراء يمكنهم إدارة كل التقييمات
CREATE POLICY "Managers can manage all evaluations" 
    ON public.employee_evaluations FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND employee_type_id IN (SELECT id FROM public.employee_types WHERE name IN ('مدير قسم فني', 'مدير عام'))));

-- ========================================
-- Triggers
-- ========================================
CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON public.employee_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Functions
-- ========================================

-- دالة للحصول على متوسط تقييمات الموظف
CREATE OR REPLACE FUNCTION get_employee_average_evaluation(p_employee_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_average DECIMAL(3,2);
BEGIN
    SELECT AVG(average_score) INTO v_average
    FROM public.employee_evaluations
    WHERE employee_id = p_employee_id
    AND status = 'معتمد';
    
    RETURN COALESCE(v_average, 0);
END;
$$;

-- دالة للحصول على آخر تقييم للموظف
CREATE OR REPLACE FUNCTION get_employee_latest_evaluation(p_employee_id UUID)
RETURNS TABLE (
    month INTEGER,
    year INTEGER,
    average DECIMAL(3,2),
    grade TEXT,
    performance INTEGER,
    commitment INTEGER,
    customer_service INTEGER,
    teamwork INTEGER,
    innovation INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        evaluation_month,
        evaluation_year,
        average_score,
        employee_evaluations.grade,
        performance_score,
        commitment_score,
        customer_service_score,
        teamwork_score,
        innovation_score
    FROM public.employee_evaluations
    WHERE employee_id = p_employee_id
    AND status = 'معتمد'
    ORDER BY evaluation_year DESC, evaluation_month DESC
    LIMIT 1;
END;
$$;

-- دالة للحصول على إحصائيات التقييمات للموظف
CREATE OR REPLACE FUNCTION get_employee_evaluation_stats(p_employee_id UUID)
RETURNS TABLE (
    total_evaluations INTEGER,
    average_score DECIMAL(3,2),
    excellent_count INTEGER,
    very_good_count INTEGER,
    good_count INTEGER,
    acceptable_count INTEGER,
    poor_count INTEGER,
    best_score DECIMAL(3,2),
    worst_score DECIMAL(3,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد'),
        (SELECT COALESCE(AVG(average_score), 0)::DECIMAL(3,2) FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد' AND grade = 'ممتاز'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد' AND grade = 'جيد جداً'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد' AND grade = 'جيد'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد' AND grade = 'مقبول'),
        (SELECT COUNT(*)::INTEGER FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد' AND grade = 'ضعيف'),
        (SELECT COALESCE(MAX(average_score), 0)::DECIMAL(3,2) FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد'),
        (SELECT COALESCE(MIN(average_score), 0)::DECIMAL(3,2) FROM public.employee_evaluations WHERE employee_id = p_employee_id AND status = 'معتمد');
END;
$$;

-- دالة للحصول على تقييمات الموظف في سنة معينة
CREATE OR REPLACE FUNCTION get_employee_yearly_evaluations(
    p_employee_id UUID,
    p_year INTEGER
)
RETURNS TABLE (
    month INTEGER,
    average DECIMAL(3,2),
    grade TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        evaluation_month,
        average_score,
        employee_evaluations.grade
    FROM public.employee_evaluations
    WHERE employee_id = p_employee_id
    AND evaluation_year = p_year
    AND status = 'معتمد'
    ORDER BY evaluation_month;
END;
$$;

-- دالة لمقارنة أداء الموظف بين شهرين
CREATE OR REPLACE FUNCTION compare_employee_performance(
    p_employee_id UUID,
    p_month1 INTEGER,
    p_year1 INTEGER,
    p_month2 INTEGER,
    p_year2 INTEGER
)
RETURNS TABLE (
    month1_score DECIMAL(3,2),
    month2_score DECIMAL(3,2),
    difference DECIMAL(3,2),
    improvement_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_score1 DECIMAL(3,2);
    v_score2 DECIMAL(3,2);
BEGIN
    SELECT average_score INTO v_score1
    FROM public.employee_evaluations
    WHERE employee_id = p_employee_id
    AND evaluation_year = p_year1
    AND evaluation_month = p_month1
    AND status = 'معتمد';
    
    SELECT average_score INTO v_score2
    FROM public.employee_evaluations
    WHERE employee_id = p_employee_id
    AND evaluation_year = p_year2
    AND evaluation_month = p_month2
    AND status = 'معتمد';
    
    RETURN QUERY
    SELECT 
        COALESCE(v_score1, 0),
        COALESCE(v_score2, 0),
        COALESCE(v_score2, 0) - COALESCE(v_score1, 0),
        CASE 
            WHEN v_score1 > 0 THEN ((COALESCE(v_score2, 0) - COALESCE(v_score1, 0)) / v_score1 * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END;
END;
$$;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE public.employee_evaluations IS 'جدول التقييمات الشهرية للموظفين';

COMMENT ON COLUMN public.employee_evaluations.performance_score IS 'تقييم الأداء (1-5)';
COMMENT ON COLUMN public.employee_evaluations.commitment_score IS 'تقييم الالتزام (1-5)';
COMMENT ON COLUMN public.employee_evaluations.customer_service_score IS 'تقييم خدمة العملاء (1-5)';
COMMENT ON COLUMN public.employee_evaluations.teamwork_score IS 'تقييم العمل الجماعي (1-5)';
COMMENT ON COLUMN public.employee_evaluations.innovation_score IS 'تقييم الابتكار (1-5)';
COMMENT ON COLUMN public.employee_evaluations.average_score IS 'المتوسط (محسوب تلقائياً)';
COMMENT ON COLUMN public.employee_evaluations.grade IS 'التقدير: ممتاز، جيد جداً، جيد، مقبول، ضعيف (محسوب تلقائياً)';

COMMENT ON FUNCTION get_employee_average_evaluation IS 'الحصول على متوسط تقييمات الموظف';
COMMENT ON FUNCTION get_employee_latest_evaluation IS 'الحصول على آخر تقييم للموظف';
COMMENT ON FUNCTION get_employee_evaluation_stats IS 'الحصول على إحصائيات التقييمات للموظف';
COMMENT ON FUNCTION get_employee_yearly_evaluations IS 'الحصول على تقييمات الموظف في سنة معينة';
COMMENT ON FUNCTION compare_employee_performance IS 'مقارنة أداء الموظف بين شهرين';
