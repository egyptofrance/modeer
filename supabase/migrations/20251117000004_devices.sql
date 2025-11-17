-- Create device status enum
CREATE TYPE device_status AS ENUM (
    'waiting',
    'in_progress',
    'completed',
    'delivered'
);

-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) NOT NULL,
    device_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    problem_description TEXT NOT NULL,
    status device_status DEFAULT 'waiting',
    assigned_technician_id UUID REFERENCES public.employees(id),
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_devices_customer_id ON public.devices(customer_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_devices_assigned_technician ON public.devices(assigned_technician_id);
CREATE INDEX idx_devices_received_date ON public.devices(received_date);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create policies
-- All authenticated users can read devices
CREATE POLICY "Authenticated users can read devices" 
    ON public.devices 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Reception and admins can insert devices
CREATE POLICY "Reception and admins can insert devices" 
    ON public.devices 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid()
            AND et.code_prefix IN ('201', '601', '701')
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Technicians can update devices assigned to them
CREATE POLICY "Technicians can update their devices" 
    ON public.devices 
    FOR UPDATE 
    TO authenticated 
    USING (
        assigned_technician_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.employee_types et ON e.employee_type_id = et.id
            WHERE e.user_id = auth.uid()
            AND et.code_prefix IN ('601', '701')
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_application_admin = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create device_status_history table
CREATE TABLE IF NOT EXISTS public.device_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
    status device_status NOT NULL,
    notes TEXT,
    changed_by_employee_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_device_status_history_device_id ON public.device_status_history(device_id);
CREATE INDEX idx_device_status_history_created_at ON public.device_status_history(created_at);

-- Enable RLS
ALTER TABLE public.device_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read device status history" 
    ON public.device_status_history 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Authenticated users can insert device status history" 
    ON public.device_status_history 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Function to track device status changes
CREATE OR REPLACE FUNCTION track_device_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
        INSERT INTO public.device_status_history (device_id, status, changed_by_employee_id)
        VALUES (
            NEW.id, 
            NEW.status,
            (SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track status changes
CREATE TRIGGER track_device_status_changes
    AFTER INSERT OR UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION track_device_status_change();
