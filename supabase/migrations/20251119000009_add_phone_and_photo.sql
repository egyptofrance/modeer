-- إضافة أرقام التليفونات والصورة الشخصية لجدول employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS personal_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS relative_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS relative_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS relative_relation VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- إضافة تعليقات للحقول
COMMENT ON COLUMN public.employees.personal_phone IS 'رقم تليفون الموظف الشخصي';
COMMENT ON COLUMN public.employees.relative_phone IS 'رقم تليفون قريب (للطوارئ)';
COMMENT ON COLUMN public.employees.relative_name IS 'اسم القريب';
COMMENT ON COLUMN public.employees.relative_relation IS 'صلة القرابة (أب/أم/أخ/أخت)';
COMMENT ON COLUMN public.employees.company_phone IS 'رقم تليفون الشركة المستلم';
COMMENT ON COLUMN public.employees.profile_photo_url IS 'رابط الصورة الشخصية';
