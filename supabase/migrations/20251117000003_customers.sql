-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    assigned_by_employee_id UUID REFERENCES public.employees(id),
    registered_by_employee_id UUID REFERENCES public.employees(id),
    has_visited BOOLEAN DEFAULT false,
    visit_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX idx_customers_assigned_by ON public.customers(assigned_by_employee_id);
CREATE INDEX idx_customers_registered_by ON public.customers(registered_by_employee_id);
CREATE INDEX idx_customers_has_visited ON public.customers(has_visited);
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- All authenticated users can read customers
CREATE POLICY "Authenticated users can read customers" 
    ON public.customers 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Call center and reception employees can insert customers
CREATE POLICY "Call center and reception can insert customers" 
    ON public.customers 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid()
            AND et.code_prefix IN ('101', '201')
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Employees can update customers they created or registered
CREATE POLICY "Employees can update their customers" 
    ON public.customers 
    FOR UPDATE 
    TO authenticated 
    USING (
        assigned_by_employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR registered_by_employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code(p_employee_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_employee_code TEXT;
    v_next_number INTEGER;
    v_code TEXT;
BEGIN
    -- Get the employee code
    SELECT employee_code INTO v_employee_code
    FROM public.employees
    WHERE id = p_employee_id;
    
    -- Get the next number for this employee
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM LENGTH(v_employee_code) + 2) AS INTEGER)), 0) + 1
    INTO v_next_number
    FROM public.customers
    WHERE customer_code LIKE v_employee_code || '-%';
    
    -- Generate the code (format: EMPLOYEECODE-XXXX)
    v_code := v_employee_code || '-' || LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;
