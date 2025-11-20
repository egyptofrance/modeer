-- ============================================
-- Step 2: Delegate System - Database Updates
-- ============================================
-- تحديث نظام المندوب - إضافة حقول حالة الطلب
-- Date: 2025-11-20
-- ============================================

-- 1. إضافة حقل حالة الطلب (order_status)
ALTER TABLE customer_leads 
ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending' 
CHECK (order_status IN ('pending', 'picked_up', 'delivered', 'completed', 'cancelled'));

-- 2. إضافة حقل المندوب المسؤول
ALTER TABLE customer_leads 
ADD COLUMN IF NOT EXISTS assigned_delegate_id UUID REFERENCES employees(id);

-- 3. إضافة حقل تاريخ الاستلام
ALTER TABLE customer_leads 
ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMPTZ;

-- 4. إضافة حقل تاريخ التسليم
ALTER TABLE customer_leads 
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;

-- 5. إضافة حقل ملاحظات المندوب
ALTER TABLE customer_leads 
ADD COLUMN IF NOT EXISTS delegate_notes TEXT;

-- 6. إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_customer_leads_delivery_method 
ON customer_leads(delivery_method);

CREATE INDEX IF NOT EXISTS idx_customer_leads_order_status 
ON customer_leads(order_status);

CREATE INDEX IF NOT EXISTS idx_customer_leads_assigned_delegate 
ON customer_leads(assigned_delegate_id);

-- 7. إنشاء دالة للحصول على طلبات المندوب
CREATE OR REPLACE FUNCTION get_delegate_orders(delegate_id UUID)
RETURNS TABLE (
    id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    device_type TEXT,
    device_brand TEXT,
    problem_description TEXT,
    delivery_method TEXT,
    order_status TEXT,
    coupon_code TEXT,
    created_at TIMESTAMPTZ,
    pickup_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    delegate_notes TEXT,
    call_center_employee_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.id,
        cl.customer_name,
        cl.customer_phone,
        cl.customer_email,
        cl.product_interest AS device_type,
        cl.device_brand,
        cl.problem_description,
        cl.delivery_method,
        cl.order_status,
        cl.coupon_code,
        cl.created_at,
        cl.pickup_date,
        cl.delivery_date,
        cl.delegate_notes,
        e.full_name AS call_center_employee_name
    FROM customer_leads cl
    LEFT JOIN employees e ON cl.employee_id = e.id
    WHERE 
        (cl.delivery_method = 'delegate_pickup' OR cl.delivery_method = 'shipping_company')
        AND (cl.assigned_delegate_id = delegate_id OR cl.assigned_delegate_id IS NULL)
        AND cl.order_status != 'cancelled'
    ORDER BY cl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. إنشاء دالة لتحديث حالة الطلب
CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status TEXT,
    delegate_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
BEGIN
    -- التحقق من الحالة الحالية
    SELECT order_status INTO current_status
    FROM customer_leads
    WHERE id = order_id;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- تحديث الحالة
    UPDATE customer_leads
    SET 
        order_status = new_status,
        assigned_delegate_id = COALESCE(assigned_delegate_id, delegate_id),
        pickup_date = CASE 
            WHEN new_status = 'picked_up' AND pickup_date IS NULL THEN NOW()
            ELSE pickup_date
        END,
        delivery_date = CASE 
            WHEN new_status IN ('delivered', 'completed') AND delivery_date IS NULL THEN NOW()
            ELSE delivery_date
        END,
        delegate_notes = COALESCE(notes, delegate_notes),
        updated_at = NOW()
    WHERE id = order_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. إنشاء دالة للحصول على إحصائيات المندوب
CREATE OR REPLACE FUNCTION get_delegate_stats(delegate_id UUID)
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    picked_up_orders BIGINT,
    delivered_orders BIGINT,
    completed_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE order_status = 'pending') AS pending_orders,
        COUNT(*) FILTER (WHERE order_status = 'picked_up') AS picked_up_orders,
        COUNT(*) FILTER (WHERE order_status = 'delivered') AS delivered_orders,
        COUNT(*) FILTER (WHERE order_status = 'completed') AS completed_orders
    FROM customer_leads
    WHERE 
        (delivery_method = 'delegate_pickup' OR delivery_method = 'shipping_company')
        AND (assigned_delegate_id = delegate_id OR assigned_delegate_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. منح الصلاحيات
GRANT EXECUTE ON FUNCTION get_delegate_orders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_delegate_stats(UUID) TO authenticated;

-- ============================================
-- تم الانتهاء من تحديث قاعدة البيانات
-- ============================================

-- ملاحظات:
-- 1. order_status: حالة الطلب (pending, picked_up, delivered, completed, cancelled)
-- 2. assigned_delegate_id: المندوب المسؤول عن الطلب
-- 3. pickup_date: تاريخ استلام الجهاز من العميل
-- 4. delivery_date: تاريخ تسليم الجهاز للشركة
-- 5. delegate_notes: ملاحظات المندوب
