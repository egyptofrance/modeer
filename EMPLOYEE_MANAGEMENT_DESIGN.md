# تصميم نظام إدارة الموظفين

## نظرة عامة
نظام إدارة موظفين متكامل مع نظام حوافز تلقائي ونظام أكواد للعملاء، مبني على Nextbase (Next.js + Supabase + TypeScript)

## أنواع الموظفين

### 1. موظف كول سنتر (Call Center)
- **الكود**: يبدأ بـ `101` (مثال: 101-0001 إلى 101-9999)
- **المهام**:
  - تسجيل بيانات العملاء الجدد
  - إعطاء أكواد للعملاء
  - استقبال المكالمات
- **الحوافز**:
  - حافز عند حضور العميل للشركة (العميل الذي أخذ كود من هذا الموظف)
  - حافز الحضور في الموعد وبدء العمل
  - حافز العمل في يوم الإجازة
  - حافز العمل ساعة إضافية أو ساعتين بعد الموعد
  - حافز شهري عند إكمال 9999 عميل (50% منهم يجب أن يكونوا قد حضروا)

### 2. موظف ريسبشن (Reception)
- **المهام**:
  - تسجيل حضور العميل للشركة
  - تسجيل العميل على النظام
  - ربط العميل بالتطبيق لمتابعة جهازه
- **الحوافز**:
  - حافز عند تسجيل كل عميل يحضر

### 3. موظف سائق (Driver)
- **المهام**: نقل الأجهزة والعملاء

### 4. موظف مندوب (Sales Representative)
- **المهام**: التسويق والمبيعات الخارجية

### 5. فني صيانة (Technician)
- **المهام**: صيانة الأجهزة

### 6. مدير قسم فني (Technical Manager)
- **المهام**: إدارة الفنيين والإشراف على الصيانة

### 7. مدير عام (General Manager)
- **المهام**: الإدارة العامة للشركة

## نظام الأكواد

### كود العميل
- **البنية**: `[كود الموظف]-[رقم تسلسلي]`
- **مثال**: `101-0001` (أول عميل لموظف كول سنتر رقم 101)
- **الغرض**: تتبع من استقبل العميل وربط الحافز بالموظف المناسب

### نظام الحوافز التلقائي

#### حوافز موظف الكول سنتر
1. **حافز حضور العميل**: يُضاف عندما يسجل موظف الريسبشن حضور عميل يحمل كود هذا الموظف
2. **حافز الحضور في الموعد**: يُضاف عند تسجيل الدخول في الموعد المحدد
3. **حافز يوم الإجازة**: يُضاف عند العمل في يوم إجازة رسمية
4. **حافز الساعات الإضافية**: يُضاف عند العمل ساعة أو ساعتين بعد الموعد
5. **حافز شهري**: عند إكمال 9999 عميل بشرط حضور 50% منهم

#### حوافز موظف الريسبشن
1. **حافز تسجيل العميل**: يُضاف عند تسجيل كل عميل يحضر

## قاعدة البيانات

### جداول جديدة مطلوبة

#### 1. employee_types (أنواع الموظفين)
```sql
- id (uuid)
- name (text) - اسم نوع الموظف
- code_prefix (text) - بادئة الكود (مثل: 101)
- description (text)
- created_at (timestamp)
```

#### 2. employees (الموظفين)
```sql
- id (uuid)
- user_id (uuid) - ربط مع جدول المستخدمين
- employee_type_id (uuid) - نوع الموظف
- employee_code (text) - كود الموظف الفريد
- full_name (text)
- phone (text)
- email (text)
- hire_date (date)
- base_salary (decimal)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. customers (العملاء)
```sql
- id (uuid)
- customer_code (text) - الكود الفريد للعميل
- full_name (text)
- phone (text)
- email (text)
- address (text)
- assigned_by_employee_id (uuid) - موظف الكول سنتر الذي أعطاه الكود
- registered_by_employee_id (uuid) - موظف الريسبشن الذي سجله
- has_visited (boolean) - هل حضر للشركة
- visit_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 4. devices (الأجهزة)
```sql
- id (uuid)
- customer_id (uuid)
- device_type (text) - نوع الجهاز
- brand (text)
- model (text)
- serial_number (text)
- problem_description (text)
- status (enum) - waiting, in_progress, completed, delivered
- assigned_technician_id (uuid)
- received_date (timestamp)
- completed_date (timestamp)
- delivered_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 5. incentives (الحوافز)
```sql
- id (uuid)
- employee_id (uuid)
- incentive_type (text) - نوع الحافز
- amount (decimal)
- description (text)
- related_customer_id (uuid) - العميل المرتبط بالحافز
- date (date)
- is_paid (boolean)
- created_at (timestamp)
```

#### 6. attendance (الحضور والانصراف)
```sql
- id (uuid)
- employee_id (uuid)
- check_in (timestamp)
- check_out (timestamp)
- is_holiday (boolean)
- overtime_hours (decimal)
- date (date)
- created_at (timestamp)
```

#### 7. work_schedules (مواعيد العمل)
```sql
- id (uuid)
- employee_id (uuid)
- day_of_week (integer) - 0-6
- start_time (time)
- end_time (time)
- is_active (boolean)
```

#### 8. device_status_history (تاريخ حالة الجهاز)
```sql
- id (uuid)
- device_id (uuid)
- status (text)
- notes (text)
- changed_by_employee_id (uuid)
- created_at (timestamp)
```

## الواجهات المطلوبة

### 1. لوحة موظف الكول سنتر
- عرض الراتب اليومي + الحوافز المتراكمة
- نموذج تسجيل عميل جديد وإعطاء كود
- قائمة العملاء المسجلين
- إحصائيات (عدد العملاء، نسبة الحضور، الحوافز)

### 2. لوحة موظف الريسبشن
- نموذج تسجيل حضور عميل (بإدخال الكود)
- نموذج تسجيل العميل على التطبيق
- عرض الحوافز اليومية
- قائمة العملاء الحاضرين اليوم

### 3. لوحة الفني
- قائمة الأجهزة المعينة له
- تحديث حالة الجهاز
- إضافة ملاحظات على الصيانة

### 4. لوحة المدير
- إحصائيات شاملة
- إدارة الموظفين
- إدارة الحوافز
- تقارير الأداء

### 5. تطبيق العميل (Web App)
- تسجيل دخول بالكود
- متابعة حالة الجهاز
- عرض خطوات الصيانة
- إشعارات عند تغيير الحالة

## المميزات التقنية

### 1. Real-time Updates
- استخدام Supabase Realtime لتحديث الحوافز فورياً
- إشعارات فورية عند تغيير حالة الجهاز

### 2. Automation
- حساب الحوافز تلقائياً عند:
  - تسجيل حضور عميل
  - تسجيل دخول موظف في الموعد
  - العمل في يوم إجازة
  - العمل ساعات إضافية

### 3. Analytics
- تقارير يومية/أسبوعية/شهرية
- تحليل أداء الموظفين
- معدلات التحويل (من كود إلى حضور فعلي)

### 4. Security
- Row Level Security (RLS) في Supabase
- كل موظف يرى بياناته فقط
- المدير يرى كل البيانات

## خطة التنفيذ

### المرحلة 1: قاعدة البيانات
- إنشاء جداول جديدة
- إعداد RLS policies
- إنشاء functions للحوافز التلقائية

### المرحلة 2: Backend
- API endpoints للموظفين
- API endpoints للعملاء
- API endpoints للأجهزة
- نظام الحوافز التلقائي

### المرحلة 3: Frontend
- واجهة موظف الكول سنتر
- واجهة موظف الريسبشن
- واجهة الفني
- واجهة المدير

### المرحلة 4: تطبيق العميل
- صفحة تسجيل دخول
- صفحة متابعة الجهاز
- نظام الإشعارات

### المرحلة 5: الاختبار والنشر
- اختبار النظام
- النشر على Vercel
- ربط قاعدة البيانات Supabase
