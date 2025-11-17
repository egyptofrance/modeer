-- Create employee_types table
CREATE TABLE IF NOT EXISTS public.employee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code_prefix TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Insert default employee types
INSERT INTO public.employee_types (name, code_prefix, description) VALUES
    ('موظف كول سنتر', '101', 'موظف استقبال المكالمات وتسجيل بيانات العملاء'),
    ('موظف ريسبشن', '201', 'موظف استقبال العملاء وتسجيلهم على النظام'),
    ('سائق', '301', 'سائق نقل الأجهزة والعملاء'),
    ('مندوب', '401', 'مندوب مبيعات وتسويق'),
    ('فني صيانة', '501', 'فني صيانة الأجهزة'),
    ('مدير قسم فني', '601', 'مدير القسم الفني والإشراف على الفنيين'),
    ('مدير عام', '701', 'المدير العام للشركة');

-- Create updated_at trigger
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
