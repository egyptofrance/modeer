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
