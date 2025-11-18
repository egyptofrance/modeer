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
