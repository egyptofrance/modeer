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
