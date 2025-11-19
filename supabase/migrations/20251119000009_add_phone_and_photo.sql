-- إضافة أرقام التليفونات والصورة الشخصية
ALTER TABLE employee_extended_data
ADD COLUMN IF NOT EXISTS personal_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS relative_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS relative_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS relative_relation VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- إضافة تعليقات للحقول
COMMENT ON COLUMN employee_extended_data.personal_phone IS 'رقم تليفون الموظف الشخصي';
COMMENT ON COLUMN employee_extended_data.relative_phone IS 'رقم تليفون قريب (للطوارئ)';
COMMENT ON COLUMN employee_extended_data.relative_name IS 'اسم القريب';
COMMENT ON COLUMN employee_extended_data.relative_relation IS 'صلة القرابة (أب/أم/أخ/أخت)';
COMMENT ON COLUMN employee_extended_data.company_phone IS 'رقم تليفون الشركة المستلم';
COMMENT ON COLUMN employee_extended_data.profile_photo_url IS 'رابط الصورة الشخصية';
