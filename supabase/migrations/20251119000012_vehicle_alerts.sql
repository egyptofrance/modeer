-- نظام التنبيهات للسيارات

-- جدول التنبيهات
CREATE TABLE IF NOT EXISTS public.vehicle_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'license_renewal',
        'insurance_renewal',
        'oil_change',
        'brake_pads',
        'fuel_consumption_anomaly'
    )),
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_vehicle_alerts_vehicle_id ON public.vehicle_alerts(vehicle_id);
CREATE INDEX idx_vehicle_alerts_is_read ON public.vehicle_alerts(is_read);
CREATE INDEX idx_vehicle_alerts_created_at ON public.vehicle_alerts(created_at DESC);

-- RLS Policies
ALTER TABLE public.vehicle_alerts ENABLE ROW LEVEL SECURITY;

-- Admin can see all alerts
CREATE POLICY "Admins can view all vehicle alerts"
    ON public.vehicle_alerts FOR SELECT
    USING (is_application_admin());

-- Drivers can see their vehicle alerts
CREATE POLICY "Drivers can view their vehicle alerts"
    ON public.vehicle_alerts FOR SELECT
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles 
            WHERE driver_id = (SELECT id FROM public.employees WHERE user_id = auth.uid())
        )
    );

-- Representatives can see their vehicle alerts
CREATE POLICY "Representatives can view their vehicle alerts"
    ON public.vehicle_alerts FOR SELECT
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles 
            WHERE representative_id = (SELECT id FROM public.employees WHERE user_id = auth.uid())
        )
    );

-- Admin can mark alerts as read
CREATE POLICY "Admins can update vehicle alerts"
    ON public.vehicle_alerts FOR UPDATE
    USING (is_application_admin());

-- Drivers can mark their alerts as read
CREATE POLICY "Drivers can update their vehicle alerts"
    ON public.vehicle_alerts FOR UPDATE
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles 
            WHERE driver_id = (SELECT id FROM public.employees WHERE user_id = auth.uid())
        )
    );

-- دالة للتحقق من تجديد الترخيص
CREATE OR REPLACE FUNCTION check_license_renewal_alerts()
RETURNS void AS $$
DECLARE
    v_vehicle RECORD;
    v_days_until_renewal INTEGER;
BEGIN
    FOR v_vehicle IN 
        SELECT id, vehicle_number, license_renewal_date 
        FROM public.vehicles 
        WHERE status = 'active' 
        AND license_renewal_date IS NOT NULL
    LOOP
        v_days_until_renewal := v_vehicle.license_renewal_date - CURRENT_DATE;
        
        -- تنبيه قبل 30 يوم
        IF v_days_until_renewal <= 30 AND v_days_until_renewal > 0 THEN
            INSERT INTO public.vehicle_alerts (vehicle_id, alert_type, severity, message)
            SELECT v_vehicle.id, 'license_renewal', 
                   CASE 
                       WHEN v_days_until_renewal <= 7 THEN 'critical'
                       WHEN v_days_until_renewal <= 15 THEN 'warning'
                       ELSE 'info'
                   END,
                   'ترخيص السيارة ' || v_vehicle.vehicle_number || ' سينتهي بعد ' || v_days_until_renewal || ' يوم'
            WHERE NOT EXISTS (
                SELECT 1 FROM public.vehicle_alerts 
                WHERE vehicle_id = v_vehicle.id 
                AND alert_type = 'license_renewal' 
                AND is_read = FALSE
                AND created_at > CURRENT_DATE - INTERVAL '7 days'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من تغيير الزيت والفرامل
CREATE OR REPLACE FUNCTION check_maintenance_alerts()
RETURNS void AS $$
DECLARE
    v_vehicle RECORD;
    v_last_oil_change RECORD;
    v_last_brake_change RECORD;
    v_current_odometer INTEGER;
    v_km_since_oil INTEGER;
    v_km_since_brake INTEGER;
BEGIN
    FOR v_vehicle IN 
        SELECT id, vehicle_number 
        FROM public.vehicles 
        WHERE status = 'active'
    LOOP
        -- الحصول على آخر قراءة عداد
        SELECT reading_value INTO v_current_odometer
        FROM public.vehicle_odometer_readings
        WHERE vehicle_id = v_vehicle.id
        ORDER BY reading_date DESC, reading_time DESC
        LIMIT 1;
        
        IF v_current_odometer IS NOT NULL THEN
            -- التحقق من تغيير الزيت
            SELECT * INTO v_last_oil_change
            FROM public.vehicle_maintenance
            WHERE vehicle_id = v_vehicle.id
            AND maintenance_type = 'oil_change'
            ORDER BY maintenance_date DESC
            LIMIT 1;
            
            IF v_last_oil_change.next_maintenance_km IS NOT NULL THEN
                v_km_since_oil := v_current_odometer - v_last_oil_change.odometer_reading;
                
                IF v_current_odometer >= v_last_oil_change.next_maintenance_km - 500 THEN
                    INSERT INTO public.vehicle_alerts (vehicle_id, alert_type, severity, message)
                    SELECT v_vehicle.id, 'oil_change',
                           CASE 
                               WHEN v_current_odometer >= v_last_oil_change.next_maintenance_km THEN 'critical'
                               ELSE 'warning'
                           END,
                           'السيارة ' || v_vehicle.vehicle_number || ' تحتاج تغيير زيت (باقي ' || 
                           (v_last_oil_change.next_maintenance_km - v_current_odometer) || ' كم)'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public.vehicle_alerts 
                        WHERE vehicle_id = v_vehicle.id 
                        AND alert_type = 'oil_change' 
                        AND is_read = FALSE
                        AND created_at > CURRENT_DATE - INTERVAL '7 days'
                    );
                END IF;
            END IF;
            
            -- التحقق من تغيير الفرامل
            SELECT * INTO v_last_brake_change
            FROM public.vehicle_maintenance
            WHERE vehicle_id = v_vehicle.id
            AND maintenance_type = 'brake_pads'
            ORDER BY maintenance_date DESC
            LIMIT 1;
            
            IF v_last_brake_change.next_maintenance_km IS NOT NULL THEN
                IF v_current_odometer >= v_last_brake_change.next_maintenance_km - 1000 THEN
                    INSERT INTO public.vehicle_alerts (vehicle_id, alert_type, severity, message)
                    SELECT v_vehicle.id, 'brake_pads',
                           CASE 
                               WHEN v_current_odometer >= v_last_brake_change.next_maintenance_km THEN 'critical'
                               ELSE 'warning'
                           END,
                           'السيارة ' || v_vehicle.vehicle_number || ' تحتاج تغيير تيل فرامل (باقي ' || 
                           (v_last_brake_change.next_maintenance_km - v_current_odometer) || ' كم)'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public.vehicle_alerts 
                        WHERE vehicle_id = v_vehicle.id 
                        AND alert_type = 'brake_pads' 
                        AND is_read = FALSE
                        AND created_at > CURRENT_DATE - INTERVAL '7 days'
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من معدل استهلاك الوقود
CREATE OR REPLACE FUNCTION check_fuel_consumption_alerts()
RETURNS void AS $$
DECLARE
    v_vehicle RECORD;
    v_avg_efficiency DECIMAL;
    v_recent_efficiency DECIMAL;
    v_deviation_percent DECIMAL;
BEGIN
    FOR v_vehicle IN 
        SELECT id, vehicle_number 
        FROM public.vehicles 
        WHERE status = 'active'
    LOOP
        -- حساب المعدل العام (آخر 90 يوم)
        SELECT avg_km_per_liter INTO v_avg_efficiency
        FROM calculate_fuel_efficiency(v_vehicle.id, 90);
        
        -- حساب المعدل الأخير (آخر 7 أيام)
        SELECT avg_km_per_liter INTO v_recent_efficiency
        FROM calculate_fuel_efficiency(v_vehicle.id, 7);
        
        IF v_avg_efficiency > 0 AND v_recent_efficiency > 0 THEN
            v_deviation_percent := ((v_avg_efficiency - v_recent_efficiency) / v_avg_efficiency) * 100;
            
            -- إذا انخفض المعدل بأكثر من 20%
            IF v_deviation_percent > 20 THEN
                INSERT INTO public.vehicle_alerts (vehicle_id, alert_type, severity, message)
                SELECT v_vehicle.id, 'fuel_consumption_anomaly', 'warning',
                       'استهلاك الوقود للسيارة ' || v_vehicle.vehicle_number || ' ارتفع بشكل ملحوظ. ' ||
                       'المعدل الطبيعي: ' || ROUND(v_avg_efficiency, 2) || ' كم/لتر، ' ||
                       'المعدل الحالي: ' || ROUND(v_recent_efficiency, 2) || ' كم/لتر'
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.vehicle_alerts 
                    WHERE vehicle_id = v_vehicle.id 
                    AND alert_type = 'fuel_consumption_anomaly' 
                    AND is_read = FALSE
                    AND created_at > CURRENT_DATE - INTERVAL '7 days'
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة رئيسية لتشغيل جميع الفحوصات
CREATE OR REPLACE FUNCTION run_vehicle_alerts_check()
RETURNS void AS $$
BEGIN
    PERFORM check_license_renewal_alerts();
    PERFORM check_maintenance_alerts();
    PERFORM check_fuel_consumption_alerts();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
