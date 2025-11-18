# TODO - نظام إدارة الموظفين الموسع

## المرحلة 1: توسيع بيانات الموظف ✅ (مكتملة)
- [x] إضافة حقول جديدة لجدول employees:
  - [x] تاريخ الميلاد (date_of_birth)
  - [x] المؤهل (qualification_level)
  - [x] اسم المؤهل (qualification_name)
  - [x] العنوان (address)
  - [x] حالة إثبات العنوان (address_verified)
  - [x] تاريخ التقدم للوظيفة (application_date)
  - [x] سكور الاختبار الأولي (initial_test_score)
  - [x] الجنس (gender)
  - [x] الراتب المبدئي (موجود بالفعل كـ base_salary)
- [x] إنشاء migration
- [x] تطبيق migration على Supabase
- [x] إنشاء دالة calculate_daily_salary
- [x] إنشاء دالة is_eligible_for_leave
- [x] دفع التغييرات إلى GitHub
- [x] اختبار النشر على Vercel ✅

---

## المرحلة 2: نظام المستندات ✅ (مكتملة)
- [x] إنشاء جدول employee_documents:
  - [x] id_card_front (صورة البطاقة وجه)
  - [x] id_card_back (صورة البطاقة ظهر)
  - [x] utility_bill (إيصال مرافق)
  - [x] birth_certificate (شهادة الميلاد)
  - [x] qualification_certificate (المؤهل الدراسي)
  - [x] military_certificate (شهادة التجنيد - للذكور)
  - [x] application_form (صورة Application)
- [x] إنشاء دالة check_documents_complete
- [x] إنشاء Trigger لتحديث حالة الاكتمال تلقائياً
- [x] Row Level Security policies
- [x] إنشاء migration
- [x] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] اختبار النشر على Vercel

---

## المرحلة 3: جدول الحوافز المقررة
- [ ] إنشاء جدول incentive_rules:
  - [ ] employee_type_id
  - [ ] incentive_name
  - [ ] incentive_amount
  - [ ] incentive_description
- [ ] إضافة حوافز افتراضية لكل نوع وظيفة
- [ ] إنشاء server actions لإدارة الحوافز المقررة
- [ ] إنشاء صفحة للأدمن لتعديل الحوافز
- [ ] إنشاء migration
- [ ] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] ✅ اختبار النشر على Vercel

---

## المرحلة 4: نظام التوجيهات والاختبارات
- [ ] إنشاء جدول guidelines (التوجيهات):
  - [ ] title
  - [ ] content
  - [ ] created_by (admin_id)
  - [ ] target_employee_types (array)
- [ ] إنشاء جدول employee_guidelines (تعيين توجيهات):
  - [ ] employee_id
  - [ ] guideline_id
  - [ ] read_status
- [ ] إنشاء جدول tests (الاختبارات):
  - [ ] title
  - [ ] questions (jsonb)
  - [ ] target_employee_types
- [ ] إنشاء جدول employee_tests (نتائج الاختبارات):
  - [ ] employee_id
  - [ ] test_id
  - [ ] score (%)
  - [ ] completed_at
- [ ] إنشاء server actions
- [ ] إنشاء صفحات الأدمن
- [ ] إنشاء صفحات الموظف
- [ ] إنشاء migration
- [ ] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] ✅ اختبار النشر على Vercel

---

## المرحلة 5: نظام العقوبات والخصومات
- [ ] إنشاء جدول penalties (العقوبات):
  - [ ] employee_id
  - [ ] penalty_type (تأخير، غياب، خطأ)
  - [ ] amount
  - [ ] reason
  - [ ] applied_by (admin_id)
  - [ ] applied_at
- [ ] إنشاء جدول penalty_rules (قواعد العقوبات):
  - [ ] penalty_type
  - [ ] amount
  - [ ] description
- [ ] إضافة قواعد افتراضية:
  - [ ] خصم التأخير (10 جنيه/15 دقيقة)
  - [ ] خصم الغياب (يوم راتب)
- [ ] إنشاء server actions
- [ ] إنشاء صفحات الأدمن
- [ ] عرض العقوبات في Dashboard الموظف
- [ ] إنشاء migration
- [ ] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] ✅ اختبار النشر على Vercel

---

## المرحلة 6: نظام الإجازات (بعد 6 شهور)
- [ ] إنشاء جدول leave_requests (طلبات الإجازة):
  - [ ] employee_id
  - [ ] leave_type (سنوية، مرضية، طارئة)
  - [ ] start_date
  - [ ] end_date
  - [ ] days_count
  - [ ] reason
  - [ ] status (pending, approved, rejected)
  - [ ] reviewed_by (admin_id)
- [ ] إنشاء جدول leave_balance (رصيد الإجازات):
  - [ ] employee_id
  - [ ] annual_leave_balance (30 يوم)
  - [ ] sick_leave_balance
- [ ] إضافة function لحساب أهلية الإجازة (بعد 6 شهور)
- [ ] إنشاء server actions
- [ ] إنشاء صفحة طلب إجازة للموظف
- [ ] إنشاء صفحة موافقة الأدمن
- [ ] إنشاء migration
- [ ] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] ✅ اختبار النشر على Vercel

---

## المرحلة 7: نظام التقييم الشهري
- [ ] إنشاء جدول employee_evaluations (التقييمات):
  - [ ] employee_id
  - [ ] evaluation_date
  - [ ] performance_score (1-5)
  - [ ] commitment_score (1-5)
  - [ ] customer_service_score (1-5)
  - [ ] average_score
  - [ ] notes
  - [ ] evaluated_by (admin_id)
- [ ] إنشاء server actions
- [ ] إنشاء صفحة التقييم للأدمن
- [ ] عرض التقييمات في Dashboard الموظف
- [ ] إنشاء migration
- [ ] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] ✅ اختبار النشر على Vercel

---

## المرحلة 8: تحديث Dashboard الموظف
- [ ] إنشاء Header جديد:
  - [ ] الراتب اليومي (Daily Salary)
  - [ ] الحوافز اليومية (Daily Incentives)
  - [ ] الإجمالي (Total)
  - [ ] ملحوظة: "قيمة الحافز تحدد على أساس نتيجة الاختبار/KPIs"
- [ ] إضافة قسم "بياناتي":
  - [ ] عرض البيانات الشخصية
  - [ ] حالة إثبات العنوان
  - [ ] المستندات المرفوعة
- [ ] إضافة قسم "جدول الحوافز المقررة"
- [ ] إضافة قسم "التوجيهات"
- [ ] إضافة قسم "الاختبارات"
- [ ] إضافة قسم "العقوبات"
- [ ] إضافة قسم "الإجازات"
- [ ] إضافة قسم "التقييمات"
- [ ] دفع التغييرات إلى GitHub
- [ ] ✅ اختبار النشر على Vercel

---

## المرحلة 9: تسليم النظام النهائي
- [ ] إنشاء ملف توثيق شامل
- [ ] إنشاء دليل الاستخدام
- [ ] اختبار شامل للنظام
- [ ] تسليم النظام

---

## ملاحظات مهمة:
- ✅ اختبار النشر بعد كل مرحلة
- ✅ عدم الانتقال للمرحلة التالية إلا بعد نجاح النشر
- ✅ حفظ نسخة احتياطية من قاعدة البيانات قبل كل migration
