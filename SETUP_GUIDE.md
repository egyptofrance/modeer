# دليل الإعداد والتشغيل - نظام إدارة الموظفين

## المتطلبات الأساسية

قبل البدء، تأكد من توفر:

1. حساب **Supabase** (مجاني)
2. حساب **Vercel** (مجاني) - موجود بالفعل
3. حساب **GitHub** - موجود بالفعل

## خطوات الإعداد

### 1. إنشاء مشروع Supabase

#### أ. إنشاء المشروع

1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اضغط على **New Project**
3. املأ البيانات:
   - **Name**: modeer-employee-system
   - **Database Password**: اختر كلمة مرور قوية واحفظها
   - **Region**: اختر أقرب منطقة لك (مثل: Frankfurt)
4. اضغط **Create new project**
5. انتظر حتى يكتمل إنشاء المشروع (2-3 دقائق)

#### ب. الحصول على بيانات الاتصال

بعد إنشاء المشروع:

1. اذهب إلى **Settings** → **API**
2. احفظ البيانات التالية:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (مفتاح طويل)
   - **service_role**: `eyJhbGc...` (مفتاح طويل آخر)

### 2. تطبيق Migrations على قاعدة البيانات

#### الطريقة الأولى: عبر Supabase Dashboard (الأسهل)

1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. انسخ محتوى كل ملف من ملفات migrations بالترتيب:
   - `supabase/migrations/20251117000001_employee_types.sql`
   - `supabase/migrations/20251117000002_employees.sql`
   - `supabase/migrations/20251117000003_customers.sql`
   - `supabase/migrations/20251117000004_devices.sql`
   - `supabase/migrations/20251117000005_incentives.sql`
   - `supabase/migrations/20251117000006_attendance.sql`
   - `supabase/migrations/20251117000007_customer_visit_incentive.sql`
3. الصق كل ملف في SQL Editor واضغط **Run**
4. تأكد من نجاح التنفيذ (يجب أن ترى "Success")

#### الطريقة الثانية: عبر Supabase CLI (للمطورين)

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع المحلي بمشروع Supabase
supabase link --project-ref xxxxx

# تطبيق migrations
supabase db push
```

### 3. إضافة متغيرات البيئة في Vercel

1. افتح [Vercel Dashboard](https://vercel.com/naebaks-projects/modeer)
2. اذهب إلى **Settings** → **Environment Variables**
3. أضف المتغيرات التالية:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (service_role key) | Production, Preview, Development |

4. اضغط **Save**

### 4. إعادة النشر

بعد إضافة متغيرات البيئة:

1. اذهب إلى **Deployments**
2. اضغط على النشر الأخير (الذي فشل)
3. اضغط على **⋮** (ثلاث نقاط)
4. اختر **Redeploy**
5. انتظر حتى يكتمل النشر (2-3 دقائق)

### 5. التحقق من النشر

1. افتح الموقع: [https://modeer.vercel.app](https://modeer.vercel.app)
2. يجب أن ترى صفحة Landing Page
3. اضغط على **Sign Up** لإنشاء حساب
4. سجل كمستخدم جديد

### 6. إنشاء موظفين في قاعدة البيانات

بعد التسجيل، تحتاج إلى إضافة بيانات الموظفين يدوياً:

#### أ. عبر Supabase Dashboard

1. اذهب إلى **Table Editor**
2. افتح جدول **employees**
3. اضغط **Insert** → **Insert row**
4. املأ البيانات:
   - `user_id`: انسخ ID المستخدم من جدول `users`
   - `employee_type_id`: 1 (للكول سنتر) أو 2 (للريسبشن)
   - `employee_code`: مثل `1010001` للكول سنتر أو `2010001` للريسبشن
   - `full_name`: اسم الموظف
   - `email`: البريد الإلكتروني
   - `phone`: رقم الهاتف
   - `base_salary`: الراتب الأساسي (مثل: 5000)
   - `daily_salary`: الراتب اليومي (مثل: 166.67)
   - `is_active`: true
5. اضغط **Save**

#### ب. عبر SQL

```sql
-- إضافة موظف كول سنتر
INSERT INTO employees (
  user_id,
  employee_type_id,
  employee_code,
  full_name,
  email,
  phone,
  base_salary,
  daily_salary,
  is_active
) VALUES (
  'user-id-from-auth-users-table',
  1,
  '1010001',
  'أحمد محمد',
  'ahmed@example.com',
  '01234567890',
  5000,
  166.67,
  true
);

-- إضافة موظف ريسبشن
INSERT INTO employees (
  user_id,
  employee_type_id,
  employee_code,
  full_name,
  email,
  phone,
  base_salary,
  daily_salary,
  is_active
) VALUES (
  'another-user-id',
  2,
  '2010001',
  'فاطمة علي',
  'fatma@example.com',
  '01234567891',
  4500,
  150,
  true
);
```

### 7. الوصول إلى الواجهات

بعد إنشاء الموظفين، يمكنك الوصول إلى:

- **لوحة الكول سنتر**: `https://modeer.vercel.app/ar/employee/call-center`
- **لوحة الريسبشن**: `https://modeer.vercel.app/ar/employee/reception`
- **تتبع العميل**: `https://modeer.vercel.app/ar/customer-tracking`

## استخدام النظام

### موظف الكول سنتر

1. سجل الدخول بحساب موظف الكول سنتر
2. افتح `/ar/employee/call-center`
3. سجل الحضور
4. أضف عملاء جدد
5. راقب الحوافز اليومية

### موظف الريسبشن

1. سجل الدخول بحساب موظف الريسبشن
2. افتح `/ar/employee/reception`
3. ابحث عن العميل بالكود
4. سجل حضور العميل
5. سجل الجهاز للصيانة

### العميل

1. احصل على الكود من موظف الكول سنتر
2. افتح `/ar/customer-tracking`
3. أدخل الكود
4. تابع حالة جهازك

## إعدادات الحوافز

يمكنك تعديل مبالغ الحوافز من جدول `incentive_settings`:

```sql
-- تعديل حافز حضور العميل
UPDATE incentive_settings
SET amount = 75
WHERE incentive_type = 'customer_visit';

-- تعديل حافز الحضور في الموعد
UPDATE incentive_settings
SET amount = 30
WHERE incentive_type = 'on_time_attendance';
```

## إضافة مواعيد العمل

لتفعيل حافز الحضور في الموعد، أضف مواعيد العمل:

```sql
-- إضافة موعد عمل لموظف
INSERT INTO work_schedules (
  employee_id,
  day_of_week,
  start_time,
  end_time,
  is_working_day
) VALUES
  (1, 0, '09:00', '17:00', true), -- الأحد
  (1, 1, '09:00', '17:00', true), -- الاثنين
  (1, 2, '09:00', '17:00', true), -- الثلاثاء
  (1, 3, '09:00', '17:00', true), -- الأربعاء
  (1, 4, '09:00', '17:00', true), -- الخميس
  (1, 5, '09:00', '17:00', false), -- الجمعة (إجازة)
  (1, 6, '09:00', '17:00', false); -- السبت (إجازة)
```

## إضافة الإجازات الرسمية

```sql
-- إضافة إجازة رسمية
INSERT INTO holidays (
  holiday_name,
  holiday_date,
  is_recurring
) VALUES
  ('عيد الفطر', '2025-04-10', false),
  ('عيد الأضحى', '2025-06-16', false),
  ('ثورة 25 يناير', '2025-01-25', true);
```

## استكشاف الأخطاء

### الموقع لا يعمل بعد النشر

1. تأكد من إضافة متغيرات البيئة في Vercel
2. تأكد من تطبيق جميع migrations
3. تحقق من logs في Vercel Dashboard

### لا يمكن تسجيل الدخول

1. تأكد من تفعيل Email Authentication في Supabase
2. اذهب إلى **Authentication** → **Providers**
3. تأكد من تفعيل **Email**

### الحوافز لا تُضاف تلقائياً

1. تأكد من تطبيق migration رقم 7 (customer_visit_incentive)
2. تحقق من وجود بيانات في جدول `incentive_settings`
3. تحقق من وجود مواعيد عمل في `work_schedules`

## التطوير المحلي

إذا أردت تشغيل المشروع محلياً:

```bash
# استنساخ المشروع
git clone https://github.com/egyptofrance/modeer.git
cd modeer

# تثبيت المكتبات
pnpm install

# نسخ ملف البيئة
cp .env.local.example .env.local

# تعديل .env.local وإضافة بيانات Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# تشغيل المشروع
pnpm dev
```

افتح [http://localhost:3000](http://localhost:3000)

## الدعم

للمساعدة:
- **GitHub Issues**: https://github.com/egyptofrance/modeer/issues
- **Email**: egyptofrance@gmail.com

---

**ملاحظة**: هذا النظام في مرحلة التطوير الأولية. يُنصح باختباره جيداً قبل الاستخدام الفعلي في بيئة الإنتاج.
