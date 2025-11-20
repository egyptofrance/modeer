-- ========================================
-- الخطوة 1: تحديث نظام الكول سنتر وتسجيل العملاء
-- ========================================
-- التاريخ: 20 نوفمبر 2025
-- الهدف: إضافة الحقول الناقصة وتحديث نظام توليد الأكواد
-- ========================================

-- 1. إضافة الحقول الجديدة لجدول customer_leads
-- ========================================

-- إضافة حقل ماركة الجهاز (Brand)
ALTER TABLE public.customer_leads 
ADD COLUMN IF NOT EXISTS device_brand TEXT;

-- إضافة حقل شكوى العميل (Problem Description)
ALTER TABLE public.customer_leads 
ADD COLUMN IF NOT EXISTS problem_description TEXT;

-- إضافة حقل طريقة التوصيل (Delivery Method)
-- الخيارات: self_pickup (استلام شخصي), shipping_company (شركة شحن), delegate_pickup (مندوب يستلم)
ALTER TABLE public.customer_leads 
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'self_pickup' 
CHECK (delivery_method IN ('self_pickup', 'shipping_company', 'delegate_pickup'));

-- 2. تحديث دالة توليد الأكواد المتسلسلة
-- ========================================

-- حذف الدالة القديمة إن وجدت
DROP FUNCTION IF EXISTS generate_coupon_code(TEXT);

-- إنشاء الدالة الجديدة لتوليد الأكواد المتسلسلة
CREATE OR REPLACE FUNCTION generate_coupon_code(p_employee_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_sequence_number INTEGER;
    v_coupon_code TEXT;
BEGIN
    -- الحصول على آخر رقم تسلسلي للموظف من الأكواد الموجودة
    -- نستخرج الجزء بعد الشرطة ونحوله لرقم
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(coupon_code FROM POSITION('-' IN coupon_code) + 1) 
            AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence_number
    FROM public.customer_leads
    WHERE call_center_employee_code = p_employee_code;
    
    -- توليد الكود بصيغة: كود_الموظف-رقم_تسلسلي_من_4_خانات
    -- مثال: 101-0001, 101-0002, ..., 101-9999
    v_coupon_code := p_employee_code || '-' || LPAD(v_sequence_number::TEXT, 4, '0');
    
    RETURN v_coupon_code;
END;
$$;

-- 3. إضافة تعليقات توضيحية
-- ========================================

COMMENT ON COLUMN public.customer_leads.device_brand IS 'ماركة الجهاز (مثال: Apple, Samsung, HP)';
COMMENT ON COLUMN public.customer_leads.problem_description IS 'وصف المشكلة أو الشكوى من الجهاز';
COMMENT ON COLUMN public.customer_leads.delivery_method IS 'طريقة استلام/توصيل الجهاز: self_pickup (استلام شخصي), shipping_company (شركة شحن), delegate_pickup (مندوب يستلم)';

-- 4. إنشاء Index للبحث السريع
-- ========================================

CREATE INDEX IF NOT EXISTS idx_customer_leads_delivery_method 
ON public.customer_leads(delivery_method);

-- ========================================
-- ملاحظات مهمة:
-- ========================================
-- 1. دالة generate_coupon_code تولد أكواداً متسلسلة لكل موظف
-- 2. الأكواد تبدأ من 0001 وتصل إلى 9999 لكل موظف
-- 3. الحقول الجديدة اختيارية (nullable) لعدم التأثير على البيانات الموجودة
-- 4. يمكن جعل بعض الحقول إجبارية لاحقاً بعد التأكد من عمل النظام
-- ========================================

-- اختبار الدالة (اختياري - يمكن حذفه)
-- SELECT generate_coupon_code('101');
-- SELECT generate_coupon_code('201');
