-- Create incentive type enum
CREATE TYPE incentive_type AS ENUM (
    'customer_visit',
    'on_time_attendance',
    'holiday_work',
    'overtime',
    'monthly_milestone',
    'customer_registration',
    'other'
);

-- Create incentives table
CREATE TABLE IF NOT EXISTS public.incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    incentive_type incentive_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    related_customer_id UUID REFERENCES public.customers(id),
    date DATE DEFAULT CURRENT_DATE,
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_incentives_employee_id ON public.incentives(employee_id);
CREATE INDEX idx_incentives_type ON public.incentives(incentive_type);
CREATE INDEX idx_incentives_date ON public.incentives(date);
CREATE INDEX idx_incentives_is_paid ON public.incentives(is_paid);

-- Enable RLS
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Employees can read their own incentives
CREATE POLICY "Employees can read their own incentives" 
    ON public.incentives 
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

-- System can insert incentives (will be done via functions)
CREATE POLICY "System can insert incentives" 
    ON public.incentives 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Admins can update incentives
CREATE POLICY "Admins can update incentives" 
    ON public.incentives 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_incentives_updated_at
    BEFORE UPDATE ON public.incentives
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create incentive_settings table for configurable amounts
CREATE TABLE IF NOT EXISTS public.incentive_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incentive_type incentive_type NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.incentive_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read incentive settings" 
    ON public.incentive_settings 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Admins can manage incentive settings" 
    ON public.incentive_settings 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Insert default incentive settings
INSERT INTO public.incentive_settings (incentive_type, amount, description) VALUES
    ('customer_visit', 50.00, 'حافز عند حضور العميل للشركة'),
    ('on_time_attendance', 20.00, 'حافز الحضور في الموعد'),
    ('holiday_work', 100.00, 'حافز العمل في يوم الإجازة'),
    ('overtime', 30.00, 'حافز الساعة الإضافية'),
    ('monthly_milestone', 500.00, 'حافز شهري عند إكمال الهدف'),
    ('customer_registration', 30.00, 'حافز تسجيل العميل (ريسبشن)'),
    ('other', 0.00, 'حوافز أخرى');

-- Create updated_at trigger
CREATE TRIGGER update_incentive_settings_updated_at
    BEFORE UPDATE ON public.incentive_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to add incentive
CREATE OR REPLACE FUNCTION add_incentive(
    p_employee_id UUID,
    p_incentive_type incentive_type,
    p_related_customer_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_amount DECIMAL(10, 2);
    v_incentive_id UUID;
BEGIN
    -- Get the amount from settings
    SELECT amount INTO v_amount
    FROM public.incentive_settings
    WHERE incentive_type = p_incentive_type
    AND is_active = true;
    
    -- If no amount found, return null
    IF v_amount IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Insert the incentive
    INSERT INTO public.incentives (
        employee_id,
        incentive_type,
        amount,
        description,
        related_customer_id
    ) VALUES (
        p_employee_id,
        p_incentive_type,
        v_amount,
        p_description,
        p_related_customer_id
    ) RETURNING id INTO v_incentive_id;
    
    RETURN v_incentive_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get employee daily total (salary + incentives)
CREATE OR REPLACE FUNCTION get_employee_daily_total(
    p_employee_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    daily_salary DECIMAL(10, 2),
    daily_incentives DECIMAL(10, 2),
    total DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.daily_salary,
        COALESCE(SUM(i.amount), 0) as daily_incentives,
        e.daily_salary + COALESCE(SUM(i.amount), 0) as total
    FROM public.employees e
    LEFT JOIN public.incentives i ON i.employee_id = e.id AND i.date = p_date
    WHERE e.id = p_employee_id
    GROUP BY e.id, e.daily_salary;
END;
$$ LANGUAGE plpgsql;
