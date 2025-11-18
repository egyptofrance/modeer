-- Employee Documents System
-- Migration: 20251119000002_employee_documents
-- Phase 2: Document Management System

-- إنشاء جدول المستندات
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    
    -- المستندات المطلوبة
    id_card_front TEXT,  -- رابط صورة البطاقة وجه
    id_card_back TEXT,   -- رابط صورة البطاقة ظهر
    utility_bill TEXT,   -- رابط إيصال مرافق (كهرباء/مياه/غاز)
    birth_certificate TEXT,  -- رابط شهادة الميلاد
    qualification_certificate TEXT,  -- رابط المؤهل الدراسي
    military_certificate TEXT,  -- رابط شهادة التجنيد (للذكور فقط)
    application_form TEXT,  -- رابط صورة Application
    
    -- حالة المستندات
    documents_complete BOOLEAN DEFAULT FALSE,
    documents_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- ملاحظات
    notes TEXT,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_complete ON public.employee_documents(documents_complete);
CREATE INDEX IF NOT EXISTS idx_employee_documents_verified ON public.employee_documents(documents_verified);

-- تفعيل Row Level Security
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- السياسات: الموظفون يمكنهم رؤية مستنداتهم فقط
CREATE POLICY "Employees can view their own documents" 
    ON public.employee_documents 
    FOR SELECT 
    TO authenticated 
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- السياسات: الموظفون يمكنهم رفع مستنداتهم
CREATE POLICY "Employees can upload their own documents" 
    ON public.employee_documents 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- السياسات: الموظفون يمكنهم تحديث مستنداتهم
CREATE POLICY "Employees can update their own documents" 
    ON public.employee_documents 
    FOR UPDATE 
    TO authenticated 
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    );

-- السياسات: المدراء يمكنهم رؤية كل المستندات
CREATE POLICY "Managers can view all documents" 
    ON public.employee_documents 
    FOR SELECT 
    TO authenticated 
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

-- السياسات: المدراء يمكنهم التحقق من المستندات
CREATE POLICY "Managers can verify documents" 
    ON public.employee_documents 
    FOR UPDATE 
    TO authenticated 
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

-- Trigger لتحديث updated_at
CREATE TRIGGER update_employee_documents_updated_at
    BEFORE UPDATE ON public.employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- دالة للتحقق من اكتمال المستندات
CREATE OR REPLACE FUNCTION check_documents_complete(p_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_gender TEXT;
    v_docs RECORD;
    v_complete BOOLEAN := TRUE;
BEGIN
    -- الحصول على جنس الموظف
    SELECT gender INTO v_gender
    FROM public.employees
    WHERE id = p_employee_id;
    
    -- الحصول على المستندات
    SELECT * INTO v_docs
    FROM public.employee_documents
    WHERE employee_id = p_employee_id;
    
    -- التحقق من المستندات الأساسية
    IF v_docs.id_card_front IS NULL OR v_docs.id_card_back IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.utility_bill IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.birth_certificate IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.qualification_certificate IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    IF v_docs.application_form IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    -- التحقق من شهادة التجنيد للذكور فقط
    IF v_gender = 'ذكر' AND v_docs.military_certificate IS NULL THEN
        v_complete := FALSE;
    END IF;
    
    RETURN v_complete;
END;
$$;

COMMENT ON FUNCTION check_documents_complete IS 'التحقق من اكتمال مستندات الموظف';

-- دالة لتحديث حالة اكتمال المستندات تلقائياً
CREATE OR REPLACE FUNCTION auto_update_documents_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.documents_complete := check_documents_complete(NEW.employee_id);
    RETURN NEW;
END;
$$;

-- Trigger لتحديث حالة الاكتمال تلقائياً
CREATE TRIGGER auto_update_documents_complete_trigger
    BEFORE INSERT OR UPDATE ON public.employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_documents_complete();

-- إضافة تعليقات توضيحية
COMMENT ON TABLE public.employee_documents IS 'جدول مستندات الموظفين';
COMMENT ON COLUMN public.employee_documents.id_card_front IS 'صورة البطاقة الشخصية - الوجه';
COMMENT ON COLUMN public.employee_documents.id_card_back IS 'صورة البطاقة الشخصية - الظهر';
COMMENT ON COLUMN public.employee_documents.utility_bill IS 'إيصال مرافق (كهرباء/مياه/غاز) لإثبات العنوان';
COMMENT ON COLUMN public.employee_documents.birth_certificate IS 'شهادة الميلاد';
COMMENT ON COLUMN public.employee_documents.qualification_certificate IS 'شهادة المؤهل الدراسي';
COMMENT ON COLUMN public.employee_documents.military_certificate IS 'شهادة التجنيد أو الإعفاء (للذكور فقط)';
COMMENT ON COLUMN public.employee_documents.application_form IS 'صورة من Application التقديم للوظيفة';
COMMENT ON COLUMN public.employee_documents.documents_complete IS 'هل جميع المستندات المطلوبة مكتملة';
COMMENT ON COLUMN public.employee_documents.documents_verified IS 'هل تم التحقق من المستندات من قبل المدير';
