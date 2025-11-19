-- نظام إدارة السيارات
-- Migration: 20251119000011_vehicle_management

-- جدول السيارات
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    chassis_number VARCHAR(100) NOT NULL UNIQUE,
    license_issue_date DATE,
    license_renewal_date DATE,
    license_photo_url TEXT,
    front_photo_url TEXT,
    back_photo_url TEXT,
    right_photo_url TEXT,
    left_photo_url TEXT,
    driver_id UUID REFERENCES public.employees(id),
    representative_id UUID REFERENCES public.employees(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول قراءة العداد اليومية
CREATE TABLE IF NOT EXISTS public.vehicle_odometer_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.employees(id) NOT NULL,
    reading_type VARCHAR(20) NOT NULL CHECK (reading_type IN ('start', 'end')),
    reading_value INTEGER NOT NULL,
    photo_url TEXT,
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reading_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التموين
CREATE TABLE IF NOT EXISTS public.vehicle_fueling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.employees(id) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    liters DECIMAL(10, 2) NOT NULL,
    odometer_reading INTEGER,
    photo_url TEXT,
    fueling_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fueling_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الصيانة
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.employees(id) NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('oil_change', 'brake_pads', 'tires', 'other')),
    description TEXT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    odometer_reading INTEGER NOT NULL,
    next_maintenance_km INTEGER,
    maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل الرحلات
CREATE TABLE IF NOT EXISTS public.vehicle_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.employees(id) NOT NULL,
    representative_id UUID REFERENCES public.employees(id),
    client_name VARCHAR(200) NOT NULL,
    pickup_location TEXT NOT NULL,
    delivery_location TEXT NOT NULL,
    items_description TEXT,
    items_photo_url TEXT,
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التأمين
CREATE TABLE IF NOT EXISTS public.vehicle_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    insurance_company VARCHAR(200),
    policy_number VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10, 2),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المخالفات
CREATE TABLE IF NOT EXISTS public.vehicle_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.employees(id),
    violation_type VARCHAR(200) NOT NULL,
    violation_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الحوادث والأعطال
CREATE TABLE IF NOT EXISTS public.vehicle_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.employees(id),
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('accident', 'breakdown')),
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    repair_cost DECIMAL(10, 2),
    photos_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicles_driver ON public.vehicles(driver_id);
CREATE INDEX idx_vehicles_representative ON public.vehicles(representative_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_odometer_vehicle ON public.vehicle_odometer_readings(vehicle_id);
CREATE INDEX idx_odometer_date ON public.vehicle_odometer_readings(reading_date);
CREATE INDEX idx_fueling_vehicle ON public.vehicle_fueling(vehicle_id);
CREATE INDEX idx_fueling_date ON public.vehicle_fueling(fueling_date);
CREATE INDEX idx_maintenance_vehicle ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX idx_trips_vehicle ON public.vehicle_trips(vehicle_id);
CREATE INDEX idx_trips_status ON public.vehicle_trips(status);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_odometer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_fueling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Admins can manage all vehicles"
ON public.vehicles FOR ALL TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can view their vehicle"
ON public.vehicles FOR SELECT TO authenticated
USING (driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Representatives can view their vehicle"
ON public.vehicles FOR SELECT TO authenticated
USING (representative_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS Policies for odometer readings
CREATE POLICY "Admins can view all odometer readings"
ON public.vehicle_odometer_readings FOR SELECT TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can manage their vehicle odometer"
ON public.vehicle_odometer_readings FOR ALL TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- RLS Policies for fueling
CREATE POLICY "Admins can view all fueling records"
ON public.vehicle_fueling FOR SELECT TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can manage their vehicle fueling"
ON public.vehicle_fueling FOR ALL TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- RLS Policies for maintenance
CREATE POLICY "Admins can view all maintenance records"
ON public.vehicle_maintenance FOR SELECT TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can manage their vehicle maintenance"
ON public.vehicle_maintenance FOR ALL TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- RLS Policies for trips
CREATE POLICY "Admins can view all trips"
ON public.vehicle_trips FOR SELECT TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can manage their vehicle trips"
ON public.vehicle_trips FOR ALL TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

CREATE POLICY "Representatives can manage their vehicle trips"
ON public.vehicle_trips FOR ALL TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE representative_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- RLS Policies for insurance
CREATE POLICY "Admins can manage insurance"
ON public.vehicle_insurance FOR ALL TO authenticated
USING (is_application_admin());

-- RLS Policies for violations
CREATE POLICY "Admins can manage violations"
ON public.vehicle_violations FOR ALL TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can view their violations"
ON public.vehicle_violations FOR SELECT TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- RLS Policies for incidents
CREATE POLICY "Admins can manage incidents"
ON public.vehicle_incidents FOR ALL TO authenticated
USING (is_application_admin());

CREATE POLICY "Drivers can view their incidents"
ON public.vehicle_incidents FOR SELECT TO authenticated
USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- Triggers
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON public.vehicle_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- دالة لحساب معدل استهلاك الوقود
CREATE OR REPLACE FUNCTION calculate_fuel_efficiency(p_vehicle_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
    avg_km_per_liter DECIMAL,
    total_distance INTEGER,
    total_liters DECIMAL,
    total_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH fuel_data AS (
        SELECT 
            SUM(f.liters) as total_fuel,
            SUM(f.amount_paid) as total_amount
        FROM public.vehicle_fueling f
        WHERE f.vehicle_id = p_vehicle_id
        AND f.fueling_date >= CURRENT_DATE - p_days
    ),
    distance_data AS (
        SELECT 
            MAX(reading_value) - MIN(reading_value) as distance
        FROM public.vehicle_odometer_readings
        WHERE vehicle_id = p_vehicle_id
        AND reading_date >= CURRENT_DATE - p_days
    )
    SELECT 
        CASE 
            WHEN fd.total_fuel > 0 THEN ROUND((dd.distance::DECIMAL / fd.total_fuel), 2)
            ELSE 0
        END,
        dd.distance,
        fd.total_fuel,
        fd.total_amount
    FROM fuel_data fd, distance_data dd;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_fuel_efficiency IS 'حساب معدل استهلاك الوقود لسيارة معينة';
