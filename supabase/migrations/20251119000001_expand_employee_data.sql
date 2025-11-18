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
