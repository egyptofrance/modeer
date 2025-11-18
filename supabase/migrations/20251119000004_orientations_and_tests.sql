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
