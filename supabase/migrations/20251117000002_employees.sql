-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_type_id UUID REFERENCES public.employee_types(id) NOT NULL,
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    hire_date DATE DEFAULT CURRENT_DATE,
    base_salary DECIMAL(10, 2) DEFAULT 0,
    daily_salary DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_employee_type_id ON public.employees(employee_type_id);
CREATE INDEX idx_employees_employee_code ON public.employees(employee_code);
CREATE INDEX idx_employees_is_active ON public.employees(is_active);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Employees can read their own data
CREATE POLICY "Employees can read their own data" 
    ON public.employees 
    FOR SELECT 
    TO authenticated 
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Admins can insert employees
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

-- Admins can update employees
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

-- Employees can update their own basic info
CREATE POLICY "Employees can update their own basic info" 
    ON public.employees 
    FOR UPDATE 
    TO authenticated 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate next employee code
CREATE OR REPLACE FUNCTION generate_employee_code(p_employee_type_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_next_number INTEGER;
    v_code TEXT;
BEGIN
    -- Get the prefix for this employee type
    SELECT code_prefix INTO v_prefix
    FROM public.employee_types
    WHERE id = p_employee_type_id;
    
    -- Get the next number for this prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM LENGTH(v_prefix) + 1) AS INTEGER)), 0) + 1
    INTO v_next_number
    FROM public.employees
    WHERE employee_code LIKE v_prefix || '%';
    
    -- Generate the code
    v_code := v_prefix || LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;
