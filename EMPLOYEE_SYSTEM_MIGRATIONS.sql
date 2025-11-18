-- ========================================
-- نظام إدارة الموظفين - Migrations
-- ========================================
-- يرجى تطبيق هذا الملف في SQL Editor في Supabase Dashboard
-- الخطوات:
-- 1. افتح SQL Editor في Supabase
-- 2. انسخ محتوى هذا الملف كاملاً
-- 3. الصقه في SQL Editor
-- 4. اضغط Run
-- ========================================

-- ========================================
-- 1. جدول أنواع الموظفين
-- ========================================
CREATE TABLE IF NOT EXISTS public.employee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code_prefix TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users" 
    ON public.employee_types 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow insert for admins only" 
    ON public.employee_types 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

CREATE POLICY "Allow update for admins only" 
    ON public.employee_types 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

INSERT INTO public.employee_types (name, code_prefix, description) VALUES
    ('موظف كول سنتر', '101', 'موظف استقبال المكالمات وتسجيل بيانات العملاء'),
    ('موظف ريسبشن', '201', 'موظف استقبال العملاء وتسجيلهم على النظام'),
    ('سائق', '301', 'سائق نقل الأجهزة والعملاء'),
    ('مندوب', '401', 'مندوب مبيعات وتسويق'),
    ('فني صيانة', '501', 'فني صيانة الأجهزة'),
    ('مدير قسم فني', '601', 'مدير القسم الفني والإشراف على الفنيين'),
    ('مدير عام', '701', 'المدير العام للشركة')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_types_updated_at
    BEFORE UPDATE ON public.employee_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. جدول الموظفين
-- ========================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_type_id UUID REFERENCES public.employee_types(id) ON DELETE RESTRICT NOT NULL,
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    base_salary DECIMAL(10, 2) DEFAULT 0,
    daily_salary DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_employee_type_id ON public.employees(employee_type_id);
CREATE INDEX idx_employees_employee_code ON public.employees(employee_code);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own data" 
    ON public.employees 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all employees" 
    ON public.employees 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

CREATE POLICY "Admins can insert employees" 
    ON public.employees 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

CREATE POLICY "Admins can update employees" 
    ON public.employees 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. جدول العملاء
-- ========================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT NOT NULL UNIQUE,
    call_center_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    has_visited BOOLEAN DEFAULT false,
    visit_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX idx_customers_call_center_employee_id ON public.customers(call_center_employee_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view customers" 
    ON public.customers 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Call center can insert customers" 
    ON public.customers 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid() 
            AND et.name = 'موظف كول سنتر'
        )
    );

CREATE POLICY "Reception can update customer visit" 
    ON public.customers 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid() 
            AND et.name IN ('موظف ريسبشن', 'موظف كول سنتر')
        )
    );

CREATE POLICY "Public can view customer by code" 
    ON public.customers 
    FOR SELECT 
    TO anon 
    USING (true);

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. جدول الأجهزة
-- ========================================
CREATE TYPE device_status AS ENUM (
    'pending',
    'in_progress',
    'waiting_parts',
    'completed',
    'delivered',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    device_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    problem_description TEXT NOT NULL,
    status device_status DEFAULT 'pending',
    assigned_technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_devices_customer_id ON public.devices(customer_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_devices_assigned_technician_id ON public.devices(assigned_technician_id);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view devices" 
    ON public.devices 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Reception can insert devices" 
    ON public.devices 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid() 
            AND et.name = 'موظف ريسبشن'
        )
    );

CREATE POLICY "Technicians can update devices" 
    ON public.devices 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid() 
            AND et.name IN ('فني صيانة', 'مدير قسم فني', 'موظف ريسبشن')
        )
    );

CREATE POLICY "Public can view devices by customer code" 
    ON public.devices 
    FOR SELECT 
    TO anon 
    USING (true);

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- جدول تاريخ حالة الأجهزة
CREATE TABLE IF NOT EXISTS public.device_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
    old_status device_status,
    new_status device_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_device_status_history_device_id ON public.device_status_history(device_id);

ALTER TABLE public.device_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view device status history" 
    ON public.device_status_history 
    FOR SELECT 
    TO anon 
    USING (true);

-- ========================================
-- 5. جدول الحوافز
-- ========================================
CREATE TYPE incentive_type AS ENUM (
    'customer_visit',
    'on_time_attendance',
    'holiday_work',
    'overtime',
    'monthly_target',
    'customer_registration'
);

CREATE TABLE IF NOT EXISTS public.incentive_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incentive_type incentive_type NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.incentive_settings (incentive_type, amount, description) VALUES
    ('customer_visit', 50.00, 'حافز حضور العميل للشركة'),
    ('on_time_attendance', 20.00, 'حافز الحضور في الموعد'),
    ('holiday_work', 100.00, 'حافز العمل في يوم إجازة'),
    ('overtime', 30.00, 'حافز الساعة الإضافية'),
    ('monthly_target', 500.00, 'حافز الوصول للهدف الشهري'),
    ('customer_registration', 30.00, 'حافز تسجيل حضور العميل')
ON CONFLICT (incentive_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    incentive_type incentive_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    is_paid BOOLEAN DEFAULT false,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incentives_employee_id ON public.incentives(employee_id);
CREATE INDEX idx_incentives_created_at ON public.incentives(created_at);
CREATE INDEX idx_incentives_is_paid ON public.incentives(is_paid);

ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their incentives" 
    ON public.incentives 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all incentives" 
    ON public.incentives 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- ========================================
-- 6. جدول الحضور والانصراف
-- ========================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_holiday BOOLEAN DEFAULT false,
    is_on_time BOOLEAN DEFAULT false,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_work_date ON public.attendance(work_date);
CREATE UNIQUE INDEX idx_attendance_employee_date ON public.attendance(employee_id, work_date);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their attendance" 
    ON public.attendance 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Employees can insert their attendance" 
    ON public.attendance 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Employees can update their attendance" 
    ON public.attendance 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = employee_id 
            AND employees.user_id = auth.uid()
        )
    );

-- جدول مواعيد العمل
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working_day BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_schedules_employee_id ON public.work_schedules(employee_id);
CREATE UNIQUE INDEX idx_work_schedules_employee_day ON public.work_schedules(employee_id, day_of_week);

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their schedules" 
    ON public.work_schedules 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = employee_id 
            AND employees.user_id = auth.uid()
        )
    );

-- جدول الإجازات الرسمية
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_name TEXT NOT NULL,
    holiday_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_holidays_date ON public.holidays(holiday_date);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view holidays" 
    ON public.holidays 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- ========================================
-- 7. Trigger لإضافة الحوافز تلقائياً
-- ========================================

-- Trigger عند حضور العميل
CREATE OR REPLACE FUNCTION add_customer_visit_incentive()
RETURNS TRIGGER AS $$
DECLARE
    incentive_amount DECIMAL(10, 2);
    call_center_emp_id UUID;
BEGIN
    IF NEW.has_visited = true AND (OLD.has_visited IS NULL OR OLD.has_visited = false) THEN
        SELECT amount INTO incentive_amount 
        FROM public.incentive_settings 
        WHERE incentive_type = 'customer_visit' AND is_active = true;
        
        IF incentive_amount IS NOT NULL AND NEW.call_center_employee_id IS NOT NULL THEN
            INSERT INTO public.incentives (
                employee_id,
                incentive_type,
                amount,
                description,
                reference_id
            ) VALUES (
                NEW.call_center_employee_id,
                'customer_visit',
                incentive_amount,
                'حافز حضور العميل: ' || NEW.full_name,
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_visit_incentive
    AFTER UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION add_customer_visit_incentive();

-- ========================================
-- تم الانتهاء من جميع Migrations
-- ========================================
