-- Create work_schedules table
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, day_of_week)
);

-- Create indexes
CREATE INDEX idx_work_schedules_employee_id ON public.work_schedules(employee_id);
CREATE INDEX idx_work_schedules_day_of_week ON public.work_schedules(day_of_week);

-- Enable RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can read their own schedules" 
    ON public.work_schedules 
    FOR SELECT 
    TO authenticated 
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

CREATE POLICY "Admins can manage schedules" 
    ON public.work_schedules 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_work_schedules_updated_at
    BEFORE UPDATE ON public.work_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    is_holiday BOOLEAN DEFAULT false,
    overtime_hours DECIMAL(4, 2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Create indexes
CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_check_in ON public.attendance(check_in);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can read their own attendance" 
    ON public.attendance 
    FOR SELECT 
    TO authenticated 
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

CREATE POLICY "Employees can insert their own attendance" 
    ON public.attendance 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

CREATE POLICY "Employees can update their own attendance" 
    ON public.attendance 
    FOR UPDATE 
    TO authenticated 
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create holidays table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read holidays" 
    ON public.holidays 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Admins can manage holidays" 
    ON public.holidays 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Function to check if date is holiday
CREATE OR REPLACE FUNCTION is_holiday(p_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_holiday BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.holidays WHERE date = p_date) INTO v_is_holiday;
    RETURN v_is_holiday;
END;
$$ LANGUAGE plpgsql;

-- Function to check in employee
CREATE OR REPLACE FUNCTION employee_check_in(p_employee_id UUID)
RETURNS UUID AS $$
DECLARE
    v_attendance_id UUID;
    v_schedule_start TIME;
    v_check_in_time TIME;
    v_is_holiday BOOLEAN;
    v_is_on_time BOOLEAN;
    v_employee_type_code TEXT;
BEGIN
    -- Check if already checked in today
    IF EXISTS(SELECT 1 FROM public.attendance WHERE employee_id = p_employee_id AND date = CURRENT_DATE) THEN
        RAISE EXCEPTION 'Already checked in today';
    END IF;
    
    -- Check if today is a holiday
    v_is_holiday := is_holiday(CURRENT_DATE);
    
    -- Get employee type
    SELECT et.code_prefix INTO v_employee_type_code
    FROM public.employees e
    JOIN public.employee_types et ON e.employee_type_id = et.id
    WHERE e.id = p_employee_id;
    
    -- Get scheduled start time
    SELECT start_time INTO v_schedule_start
    FROM public.work_schedules
    WHERE employee_id = p_employee_id
    AND day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
    AND is_active = true;
    
    v_check_in_time := CURRENT_TIME;
    
    -- Check if on time (within 15 minutes of scheduled start)
    v_is_on_time := (v_schedule_start IS NOT NULL AND v_check_in_time <= v_schedule_start + INTERVAL '15 minutes');
    
    -- Insert attendance record
    INSERT INTO public.attendance (employee_id, check_in, is_holiday, date)
    VALUES (p_employee_id, NOW(), v_is_holiday, CURRENT_DATE)
    RETURNING id INTO v_attendance_id;
    
    -- Add on-time incentive for call center employees
    IF v_is_on_time AND v_employee_type_code = '101' THEN
        PERFORM add_incentive(
            p_employee_id,
            'on_time_attendance'::incentive_type,
            NULL,
            'حضور في الموعد'
        );
    END IF;
    
    -- Add holiday work incentive
    IF v_is_holiday THEN
        PERFORM add_incentive(
            p_employee_id,
            'holiday_work'::incentive_type,
            NULL,
            'عمل في يوم إجازة'
        );
    END IF;
    
    RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check out employee
CREATE OR REPLACE FUNCTION employee_check_out(p_employee_id UUID)
RETURNS UUID AS $$
DECLARE
    v_attendance_id UUID;
    v_schedule_end TIME;
    v_check_out_time TIME;
    v_check_in_time TIMESTAMP WITH TIME ZONE;
    v_overtime_hours DECIMAL(4, 2);
BEGIN
    -- Get today's attendance record
    SELECT id, check_in INTO v_attendance_id, v_check_in_time
    FROM public.attendance
    WHERE employee_id = p_employee_id
    AND date = CURRENT_DATE
    AND check_out IS NULL;
    
    IF v_attendance_id IS NULL THEN
        RAISE EXCEPTION 'No check-in record found for today';
    END IF;
    
    -- Get scheduled end time
    SELECT end_time INTO v_schedule_end
    FROM public.work_schedules
    WHERE employee_id = p_employee_id
    AND day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
    AND is_active = true;
    
    v_check_out_time := CURRENT_TIME;
    
    -- Calculate overtime (if worked beyond scheduled end time)
    IF v_schedule_end IS NOT NULL AND v_check_out_time > v_schedule_end THEN
        v_overtime_hours := EXTRACT(EPOCH FROM (v_check_out_time - v_schedule_end)) / 3600;
        
        -- Round to nearest 0.5 hour
        v_overtime_hours := ROUND(v_overtime_hours * 2) / 2;
        
        -- Add overtime incentive for each hour (up to 2 hours)
        IF v_overtime_hours > 0 AND v_overtime_hours <= 2 THEN
            FOR i IN 1..LEAST(FLOOR(v_overtime_hours)::INTEGER, 2) LOOP
                PERFORM add_incentive(
                    p_employee_id,
                    'overtime'::incentive_type,
                    NULL,
                    'ساعة إضافية ' || i
                );
            END LOOP;
        END IF;
    ELSE
        v_overtime_hours := 0;
    END IF;
    
    -- Update attendance record
    UPDATE public.attendance
    SET check_out = NOW(),
        overtime_hours = v_overtime_hours,
        updated_at = NOW()
    WHERE id = v_attendance_id;
    
    RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
