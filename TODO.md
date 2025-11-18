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

## المرحلة 3: جدول الحوافز المقررة ✅ (مكتملة)
- [x] إنشاء جدول incentive_rules:
  - [x] employee_type_id
  - [x] incentive_name
  - [x] incentive_amount
  - [x] incentive_type (ثابت/متغير/نسبة مئوية)
  - [x] description & conditions
- [x] إضافة حوافز افتراضية لكل 7 أنواع وظائف
- [x] إنشاء دالة get_employee_total_incentives
- [x] Row Level Security policies
- [x] إنشاء migration
- [x] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] اختبار النشر على Vercel

---

## المرحلة 4: نظام التوجيهات والاختبارات ✅ (مكتملة)
- [x] إنشاء جدول employee_orientations
- [x] إنشاء جدول employee_tests
- [x] حساب تلقائي للنسبة المئوية وحالة النجاح
- [x] 5 دوال للتقارير والإحصائيات
- [x] Row Level Security policies
- [x] إنشاء migration
- [x] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] اختبار النشر على Vercel

---

## المرحلة 5: نظام العقوبات والخصومات ✅ (مكتملة)
- [x] إنشاء جدول employee_penalties
- [x] إنشاء جدول penalty_rules
- [x] إضافة 14 قاعدة خصم افتراضية
- [x] 9 أنواع عقوبات (تأخير، غياب، خطأ، إهمال، إلخ)
- [x] نظام موافقات للعقوبات الكبيرة
- [x] إمكانية الموضف للرد على العقوبة
- [x] 4 دوال للتقارير والإحصائيات
- [x] Row Level Security policies
- [x] إنشاء migration
- [x] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] اختبار النشر على Vercel

---

## المرحلة 6: نظام الإجازات (بعد 6 شهور) ✅ (مكتملة)
- [x] إنشاء جدول leave_requests
- [x] إنشاء جدول leave_balance
- [x] 6 أنواع إجازات (سنوية، مرضية، طارئة، بدون راتب، رسمية)
- [x] رصيد إجازات: 21 سنوي، 15 مرضي، 7 طارئة
- [x] حساب تلقائي لعدد الأيام والرصيد المتبقي
- [x] تحديث الرصيد تلقائياً عند الموافقة
- [x] دالة is_eligible_for_leave (بعد 6 شهور)
- [x] دالة check_leave_conflict (منع التعارض)
- [x] 3 دوال للتقارير والإحصائيات
- [x] Row Level Security policies
- [x] إنشاء migration
- [x] تطبيق migration على Supabase
- [ ] دفع التغييرات إلى GitHub
- [ ] اختبار النشر على Vercel

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
