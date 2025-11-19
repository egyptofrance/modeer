-- نظام تسجيل العملاء والكوبونات
-- Customer and Coupon Management System

-- ========================================
-- جدول العملاء المحتملين (Leads)
-- ========================================
CREATE TABLE IF NOT EXISTS public.customer_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- معلومات العميل
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- معلومات الاستفسار
    product_interest TEXT NOT NULL, -- الجهاز المهتم به
    notes TEXT, -- ملاحظات إضافية
    
    -- معلومات الموظف
    call_center_employee_id UUID REFERENCES public.employees(id) NOT NULL,
    call_center_employee_code TEXT NOT NULL, -- كود الموظف (مثل: 101)
    
    -- الكوبون
    coupon_code TEXT NOT NULL UNIQUE, -- مثال: 1010001-0001
    coupon_status TEXT DEFAULT 'pending' CHECK (coupon_status IN (
        'pending',    -- لم يأتِ العميل بعد
        'redeemed',   -- تم استخدام الكوبون (العميل جاء)
        'expired',    -- انتهت صلاحية الكوبون
        'cancelled'   -- تم إلغاء الكوبون
    )),
    
    -- معلومات الاستخدام
    redeemed_at TIMESTAMP WITH TIME ZONE, -- متى تم استخدام الكوبون
    redeemed_by UUID REFERENCES public.employees(id), -- موظف الريسبشن الذي فعّل الكوبون
    
    -- الحافز
    incentive_amount DECIMAL(10, 2) DEFAULT 0.00, -- مبلغ الحافز للموظف
    incentive_paid BOOLEAN DEFAULT FALSE, -- هل تم دفع الحافز
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') -- صلاحية الكوبون 30 يوم
);

-- ========================================
-- جدول إعدادات الحوافز
-- ========================================
CREATE TABLE IF NOT EXISTS public.incentive_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- نوع الحافز
    incentive_type TEXT NOT NULL UNIQUE CHECK (incentive_type IN (
        'customer_visit',      -- حافز زيارة عميل
        'monthly_target'       -- حافز الوصول للهدف الشهري
    )),
    
    -- المبلغ
    amount DECIMAL(10, 2) NOT NULL,
    
    -- الوصف
    description TEXT,
    
    -- نشط
    is_active BOOLEAN DEFAULT TRUE,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج القيم الافتراضية
INSERT INTO public.incentive_settings (incentive_type, amount, description) VALUES
('customer_visit', 50.00, 'حافز عند زيارة العميل للشركة'),
('monthly_target', 500.00, 'حافز شهري عند الوصول للهدف (20 عميل)')
ON CONFLICT (incentive_type) DO NOTHING;

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_customer_leads_employee ON public.customer_leads(call_center_employee_id);
CREATE INDEX IF NOT EXISTS idx_customer_leads_coupon ON public.customer_leads(coupon_code);
CREATE INDEX IF NOT EXISTS idx_customer_leads_status ON public.customer_leads(coupon_status);
CREATE INDEX IF NOT EXISTS idx_customer_leads_phone ON public.customer_leads(customer_phone);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.customer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_settings ENABLE ROW LEVEL SECURITY;

-- موظفو الكول سنتر يمكنهم رؤية عملائهم فقط
CREATE POLICY "Call center employees can view their own leads" 
    ON public.customer_leads FOR SELECT TO authenticated 
    USING (
        call_center_employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- موظفو الكول سنتر يمكنهم إضافة عملاء
CREATE POLICY "Call center employees can create leads" 
    ON public.customer_leads FOR INSERT TO authenticated 
    WITH CHECK (
        call_center_employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- موظفو الريسبشن يمكنهم رؤية جميع العملاء
CREATE POLICY "Reception can view all leads" 
    ON public.customer_leads FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() 
            AND employee_type_id IN (
                SELECT id FROM public.employee_types WHERE name = 'موظف ريسبشن'
            )
        )
    );

-- موظفو الريسبشن يمكنهم تحديث حالة الكوبون
CREATE POLICY "Reception can update coupon status" 
    ON public.customer_leads FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() 
            AND employee_type_id IN (
                SELECT id FROM public.employee_types WHERE name = 'موظف ريسبشن'
            )
        )
    );

-- المدراء والأدمن يمكنهم رؤية كل شيء
CREATE POLICY "Managers can manage all leads" 
    ON public.customer_leads FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() 
            AND employee_type_id IN (
                SELECT id FROM public.employee_types 
                WHERE name IN ('مدير قسم فني', 'مدير عام')
            )
        )
    );

-- الجميع يمكنهم قراءة إعدادات الحوافز
CREATE POLICY "Everyone can view incentive settings" 
    ON public.incentive_settings FOR SELECT TO authenticated 
    USING (TRUE);

-- المدراء فقط يمكنهم تعديل إعدادات الحوافز
CREATE POLICY "Managers can manage incentive settings" 
    ON public.incentive_settings FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() 
            AND employee_type_id IN (
                SELECT id FROM public.employee_types 
                WHERE name IN ('مدير قسم فني', 'مدير عام')
            )
        )
    );

-- ========================================
-- Triggers
-- ========================================
CREATE TRIGGER update_customer_leads_updated_at
    BEFORE UPDATE ON public.customer_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Functions
-- ========================================

-- دالة لتوليد كود كوبون فريد
CREATE OR REPLACE FUNCTION generate_coupon_code(p_employee_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_sequence_number INTEGER;
    v_coupon_code TEXT;
BEGIN
    -- الحصول على آخر رقم تسلسلي للموظف
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(coupon_code FROM POSITION('-' IN coupon_code) + 1) 
            AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence_number
    FROM public.customer_leads
    WHERE call_center_employee_code = p_employee_code;
    
    -- توليد الكود: كود_الموظف-رقم_تسلسلي (مثال: 1010001-0001)
    v_coupon_code := p_employee_code || '-' || LPAD(v_sequence_number::TEXT, 4, '0');
    
    RETURN v_coupon_code;
END;
$$;

-- دالة لتفعيل الكوبون
CREATE OR REPLACE FUNCTION redeem_coupon(
    p_coupon_code TEXT,
    p_reception_employee_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_lead RECORD;
    v_incentive_amount DECIMAL(10, 2);
    v_result JSON;
BEGIN
    -- التحقق من وجود الكوبون
    SELECT * INTO v_lead
    FROM public.customer_leads
    WHERE coupon_code = p_coupon_code;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'الكوبون غير موجود'
        );
    END IF;
    
    -- التحقق من حالة الكوبون
    IF v_lead.coupon_status != 'pending' THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'الكوبون تم استخدامه مسبقاً أو منتهي الصلاحية'
        );
    END IF;
    
    -- التحقق من صلاحية الكوبون
    IF v_lead.expires_at < NOW() THEN
        UPDATE public.customer_leads
        SET coupon_status = 'expired'
        WHERE id = v_lead.id;
        
        RETURN json_build_object(
            'success', FALSE,
            'error', 'الكوبون منتهي الصلاحية'
        );
    END IF;
    
    -- الحصول على مبلغ الحافز
    SELECT amount INTO v_incentive_amount
    FROM public.incentive_settings
    WHERE incentive_type = 'customer_visit' AND is_active = TRUE;
    
    -- تفعيل الكوبون
    UPDATE public.customer_leads
    SET 
        coupon_status = 'redeemed',
        redeemed_at = NOW(),
        redeemed_by = p_reception_employee_id,
        incentive_amount = v_incentive_amount
    WHERE id = v_lead.id;
    
    RETURN json_build_object(
        'success', TRUE,
        'customer_name', v_lead.customer_name,
        'employee_code', v_lead.call_center_employee_code,
        'incentive_amount', v_incentive_amount
    );
END;
$$;

-- دالة لحساب إحصائيات موظف الكول سنتر
CREATE OR REPLACE FUNCTION get_call_center_stats(p_employee_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_leads INTEGER;
    v_redeemed_leads INTEGER;
    v_pending_leads INTEGER;
    v_total_incentives DECIMAL(10, 2);
    v_paid_incentives DECIMAL(10, 2);
    v_unpaid_incentives DECIMAL(10, 2);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE coupon_status = 'redeemed'),
        COUNT(*) FILTER (WHERE coupon_status = 'pending'),
        COALESCE(SUM(incentive_amount), 0),
        COALESCE(SUM(incentive_amount) FILTER (WHERE incentive_paid = TRUE), 0),
        COALESCE(SUM(incentive_amount) FILTER (WHERE incentive_paid = FALSE), 0)
    INTO 
        v_total_leads,
        v_redeemed_leads,
        v_pending_leads,
        v_total_incentives,
        v_paid_incentives,
        v_unpaid_incentives
    FROM public.customer_leads
    WHERE call_center_employee_id = p_employee_id;
    
    RETURN json_build_object(
        'total_leads', v_total_leads,
        'redeemed_leads', v_redeemed_leads,
        'pending_leads', v_pending_leads,
        'conversion_rate', CASE WHEN v_total_leads > 0 THEN ROUND((v_redeemed_leads::DECIMAL / v_total_leads) * 100, 2) ELSE 0 END,
        'total_incentives', v_total_incentives,
        'paid_incentives', v_paid_incentives,
        'unpaid_incentives', v_unpaid_incentives
    );
END;
$$;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE public.customer_leads IS 'جدول العملاء المحتملين والكوبونات';
COMMENT ON TABLE public.incentive_settings IS 'جدول إعدادات الحوافز';

COMMENT ON COLUMN public.customer_leads.coupon_code IS 'كود الكوبون الفريد (مثال: 1010001-0001)';
COMMENT ON COLUMN public.customer_leads.coupon_status IS 'حالة الكوبون (pending, redeemed, expired, cancelled)';
COMMENT ON COLUMN public.customer_leads.incentive_amount IS 'مبلغ الحافز للموظف';

COMMENT ON FUNCTION generate_coupon_code IS 'توليد كود كوبون فريد للموظف';
COMMENT ON FUNCTION redeem_coupon IS 'تفعيل الكوبون عند زيارة العميل';
COMMENT ON FUNCTION get_call_center_stats IS 'الحصول على إحصائيات موظف الكول سنتر';
