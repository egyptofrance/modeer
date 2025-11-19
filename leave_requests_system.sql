-- ===================================
-- نظام طلبات الإجازات
-- ===================================

-- 1. جدول أنواع الإجازات
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  max_days_per_year INTEGER NOT NULL DEFAULT 30,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج أنواع الإجازات الافتراضية
INSERT INTO leave_types (name_ar, name_en, max_days_per_year, requires_approval, is_paid) VALUES
  ('إجازة سنوية', 'Annual Leave', 21, true, true),
  ('إجازة مرضية', 'Sick Leave', 15, false, true),
  ('إجازة طارئة', 'Emergency Leave', 7, true, true),
  ('إجازة بدون راتب', 'Unpaid Leave', 30, true, false),
  ('إجازة زواج', 'Marriage Leave', 3, true, true),
  ('إجازة وفاة', 'Bereavement Leave', 3, true, true)
ON CONFLICT DO NOTHING;

-- 2. جدول طلبات الإجازات
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES employees(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- 4. دالة لحساب عدد أيام الإجازة
CREATE OR REPLACE FUNCTION calculate_leave_days(
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  v_days INTEGER;
  v_current_date DATE;
  v_day_of_week INTEGER;
BEGIN
  v_days := 0;
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    -- استبعاد الجمعة (5) والسبت (6)
    v_day_of_week := EXTRACT(DOW FROM v_current_date);
    IF v_day_of_week NOT IN (5, 6) THEN
      v_days := v_days + 1;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_days;
END;
$$ LANGUAGE plpgsql;

-- 5. دالة للتحقق من رصيد الإجازات المتبقي
CREATE OR REPLACE FUNCTION get_remaining_leave_balance(
  p_employee_id UUID,
  p_leave_type_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_max_days INTEGER;
  v_used_days INTEGER;
BEGIN
  -- الحصول على الحد الأقصى للأيام
  SELECT max_days_per_year INTO v_max_days
  FROM leave_types
  WHERE id = p_leave_type_id;
  
  -- حساب الأيام المستخدمة
  SELECT COALESCE(SUM(total_days), 0) INTO v_used_days
  FROM leave_requests
  WHERE employee_id = p_employee_id
    AND leave_type_id = p_leave_type_id
    AND status = 'approved'
    AND EXTRACT(YEAR FROM start_date) = p_year;
  
  RETURN v_max_days - v_used_days;
END;
$$ LANGUAGE plpgsql;

-- 6. دالة للحصول على إحصائيات الإجازات للموظف
CREATE OR REPLACE FUNCTION get_employee_leave_stats(
  p_employee_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS TABLE (
  leave_type_name TEXT,
  max_days INTEGER,
  used_days INTEGER,
  remaining_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lt.name_ar,
    lt.max_days_per_year,
    COALESCE(SUM(lr.total_days) FILTER (WHERE lr.status = 'approved'), 0)::INTEGER,
    (lt.max_days_per_year - COALESCE(SUM(lr.total_days) FILTER (WHERE lr.status = 'approved'), 0))::INTEGER
  FROM leave_types lt
  LEFT JOIN leave_requests lr ON lr.leave_type_id = lt.id 
    AND lr.employee_id = p_employee_id
    AND EXTRACT(YEAR FROM lr.start_date) = p_year
  GROUP BY lt.id, lt.name_ar, lt.max_days_per_year
  ORDER BY lt.name_ar;
END;
$$ LANGUAGE plpgsql;

-- 7. تفعيل RLS
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 8. سياسات RLS
-- الموظفون يمكنهم رؤية أنواع الإجازات
CREATE POLICY "Anyone can view leave types"
  ON leave_types FOR SELECT
  USING (true);

-- الموظفون يمكنهم رؤية طلباتهم فقط
CREATE POLICY "Employees can view their own leave requests"
  ON leave_requests FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- الموظفون يمكنهم إنشاء طلبات
CREATE POLICY "Employees can create leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- المديرون يمكنهم رؤية جميع الطلبات
CREATE POLICY "Managers can view all leave requests"
  ON leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('مدير عام', 'general_manager', 'admin')
    )
  );

-- المديرون يمكنهم تحديث الطلبات (الموافقة/الرفض)
CREATE POLICY "Managers can update leave requests"
  ON leave_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('مدير عام', 'general_manager', 'admin')
    )
  );

COMMENT ON TABLE leave_types IS 'أنواع الإجازات المتاحة';
COMMENT ON TABLE leave_requests IS 'طلبات الإجازات من الموظفين';
