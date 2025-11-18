# نظام إدارة الموظفين الموسع - التوثيق الشامل

## نظرة عامة

تم توسيع نظام إدارة الموظفين بإضافة 7 أنظمة فرعية شاملة تغطي كل جوانب إدارة الموظفين في شركة Tradevor Egypt.

---

## 📊 ملخص الأنظمة المضافة

| النظام | الجداول | الدوال | الميزات الرئيسية |
|--------|---------|--------|------------------|
| **1. بيانات الموظف الموسعة** | employees (9 أعمدة جديدة) | 2 | تاريخ ميلاد، مؤهلات، عنوان، جنس، اختبار تقدم |
| **2. نظام المستندات** | employee_documents | 2 | 7 مستندات مطلوبة، تحقق تلقائي من الاكتمال |
| **3. الحوافز المقررة** | incentive_rules | 1 | 14 حافز لـ7 وظائف، ثابت/متغير/نسبة |
| **4. التوجيهات والاختبارات** | employee_orientations, employee_tests | 5 | تسجيل تدريبات، اختبارات بدرجات، نسبة نجاح |
| **5. العقوبات والخصومات** | employee_penalties, penalty_rules | 4 | 9 أنواع عقوبات، 14 قاعدة خصم، نظام موافقات |
| **6. نظام الإجازات** | leave_requests, leave_balance | 5 | 6 أنواع إجازات، رصيد سنوي، شرط 6 شهور |
| **7. التقييم الشهري** | employee_evaluations | 5 | 5 معايير تقييم، تقدير تلقائي، مقارنات |

**الإجمالي:** 9 جداول جديدة | 24 دالة | 7 migrations

---

## 🗂️ Phase 1: بيانات الموظف الموسعة

### الأعمدة المضافة لجدول `employees`

```sql
-- البيانات الشخصية
full_name TEXT                    -- الاسم الكامل
date_of_birth DATE                -- تاريخ الميلاد
gender TEXT                       -- الجنس (ذكر/أنثى)

-- المؤهلات
qualification_level TEXT          -- المؤهل (دبلوم، ثانوي، بكالوريوس، ماجستير، دكتوراه)
qualification_name TEXT           -- اسم المؤهل (مثال: بكالوريوس تجارة)

-- العنوان
address TEXT                      -- عنوان الموظف
address_verified BOOLEAN          -- هل تم إثبات العنوان
address_verified_date DATE        -- تاريخ إثبات العنوان

-- التوظيف
application_date DATE             -- تاريخ التقدم للوظيفة
initial_test_score INTEGER        -- سكور اختبار التقدم (0-100)
```

### الدوال

#### 1. حساب الراتب اليومي
```sql
SELECT calculate_daily_salary('employee_id_here');
-- يحسب الراتب اليومي = base_salary / 30
```

#### 2. التحقق من أهلية الإجازات
```sql
SELECT is_eligible_for_leave('employee_id_here');
-- يتحقق إذا مر 6 شهور على التعيين
```

### مثال استخدام في TypeScript

```typescript
// types/employee.ts
export type Employee = {
  // ... الحقول الموجودة
  full_name: string;
  date_of_birth: string | null;
  gender: 'ذكر' | 'أنثى' | null;
  qualification_level: string | null;
  qualification_name: string | null;
  address: string | null;
  address_verified: boolean;
  address_verified_date: string | null;
  application_date: string;
  initial_test_score: number | null;
};

// actions/employee-actions.ts
export async function getEmployeeDailySalary(employeeId: string) {
  const { data } = await supabase.rpc('calculate_daily_salary', {
    p_employee_id: employeeId
  });
  return data;
}

export async function checkLeaveEligibility(employeeId: string) {
  const { data } = await supabase.rpc('is_eligible_for_leave', {
    p_employee_id: employeeId
  });
  return data;
}
```

---

## 📄 Phase 2: نظام المستندات

### جدول `employee_documents`

```sql
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  -- المستندات المطلوبة (7 مستندات)
  id_card_front TEXT,              -- صورة البطاقة وجه
  id_card_back TEXT,               -- صورة البطاقة ظهر
  utility_bill TEXT,               -- إيصال مرافق لإثبات العنوان
  birth_certificate TEXT,          -- شهادة الميلاد
  qualification_certificate TEXT,  -- شهادة المؤهل
  military_certificate TEXT,       -- شهادة التجنيد (للذكور فقط)
  application_form TEXT,           -- صورة Application
  
  -- الحالة
  documents_complete BOOLEAN,      -- محسوب تلقائياً
  documents_verified BOOLEAN,      -- تم التحقق من المدير
  verified_by UUID,
  verified_at TIMESTAMP,
  notes TEXT
);
```

### الدوال

#### 1. التحقق من اكتمال المستندات
```sql
SELECT check_documents_complete('employee_id_here');
-- يتحقق من وجود كل المستندات المطلوبة
-- يراعي أن شهادة التجنيد للذكور فقط
```

### Trigger تلقائي
- عند إضافة أو تحديث مستند، يتم حساب `documents_complete` تلقائياً

### مثال استخدام

```typescript
// types/employee.ts
export type EmployeeDocuments = {
  id: string;
  employee_id: string;
  id_card_front: string | null;
  id_card_back: string | null;
  utility_bill: string | null;
  birth_certificate: string | null;
  qualification_certificate: string | null;
  military_certificate: string | null;
  application_form: string | null;
  documents_complete: boolean;
  documents_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
};

// actions/document-actions.ts
export async function uploadDocument(
  employeeId: string,
  documentType: string,
  file: File
) {
  // 1. رفع الملف إلى Supabase Storage
  const { data: uploadData } = await supabase.storage
    .from('employee-documents')
    .upload(`${employeeId}/${documentType}`, file);
  
  // 2. تحديث رابط المستند في الجدول
  const { data } = await supabase
    .from('employee_documents')
    .upsert({
      employee_id: employeeId,
      [documentType]: uploadData.path
    });
  
  return data;
}

export async function getEmployeeDocuments(employeeId: string) {
  const { data } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .single();
  
  return data;
}
```

---

## 🎁 Phase 3: الحوافز المقررة

### جدول `incentive_rules`

```sql
CREATE TABLE incentive_rules (
  id UUID PRIMARY KEY,
  employee_type_id UUID REFERENCES employee_types(id),
  
  incentive_name TEXT NOT NULL,
  incentive_amount DECIMAL(10,2),
  incentive_type TEXT,             -- ثابت، متغير، نسبة مئوية
  
  description TEXT,
  conditions TEXT,
  is_active BOOLEAN
);
```

### الحوافز الافتراضية (14 حافز)

| الوظيفة | الحوافز الثابتة | الحوافز المتغيرة |
|---------|-----------------|-------------------|
| **كول سنتر** | 50 جنيه شهري | 100 جنيه (100+ مكالمة) |
| **ريسبشن** | 75 جنيه شهري | 150 جنيه (تقييم 4.5+) |
| **سائق** | 100 جنيه شهري | 10 جنيه/رحلة إضافية |
| **مندوب** | 5% عمولة | 500 جنيه (هدف 50k) |
| **فني صيانة** | 150 جنيه شهري | 20 جنيه/صيانة إضافية |
| **مدير قسم** | 300 جنيه شهري | 500 جنيه (95%+ أهداف) |
| **مدير عام** | 1000 جنيه شهري | 2000 جنيه (ربع سنوي) |

### الدالة

```sql
SELECT get_employee_total_incentives('employee_id_here');
-- يحسب إجمالي الحوافز الثابتة المقررة للموظف
```

### مثال استخدام

```typescript
// types/employee.ts
export type IncentiveRule = {
  id: string;
  employee_type_id: string;
  incentive_name: string;
  incentive_amount: number;
  incentive_type: 'ثابت' | 'متغير' | 'نسبة مئوية';
  description: string | null;
  conditions: string | null;
  is_active: boolean;
};

// actions/incentive-actions.ts
export async function getEmployeeIncentiveRules(employeeId: string) {
  // 1. الحصول على نوع وظيفة الموظف
  const { data: employee } = await supabase
    .from('employees')
    .select('employee_type_id')
    .eq('id', employeeId)
    .single();
  
  // 2. الحصول على الحوافز المقررة
  const { data } = await supabase
    .from('incentive_rules')
    .select('*')
    .eq('employee_type_id', employee.employee_type_id)
    .eq('is_active', true);
  
  return data;
}

export async function getTotalFixedIncentives(employeeId: string) {
  const { data } = await supabase.rpc('get_employee_total_incentives', {
    p_employee_id: employeeId
  });
  return data;
}
```

---

## 📚 Phase 4: التوجيهات والاختبارات

### جدول `employee_orientations`

```sql
CREATE TABLE employee_orientations (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  orientation_title TEXT NOT NULL,
  orientation_description TEXT,
  orientation_type TEXT,           -- تعريف بالشركة، سياسات، أمن، تدريب فني
  
  duration_hours DECIMAL(5,2),
  orientation_date DATE,
  
  conducted_by UUID,
  conducted_by_name TEXT,
  
  status TEXT,                     -- مجدول، جاري، مكتمل، ملغي
  completion_percentage INTEGER,
  
  notes TEXT,
  attachments TEXT[]
);
```

### جدول `employee_tests`

```sql
CREATE TABLE employee_tests (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  test_title TEXT NOT NULL,
  test_description TEXT,
  test_type TEXT,                  -- تقييم، دوري، ترقية، فني
  
  total_score INTEGER,
  obtained_score INTEGER,
  passing_score INTEGER,
  percentage DECIMAL(5,2),         -- محسوب تلقائياً
  passed BOOLEAN,                  -- محسوب تلقائياً
  
  test_date DATE,
  completion_date DATE,
  
  conducted_by UUID,
  notes TEXT,
  feedback TEXT
);
```

### الدوال (5 دوال)

```sql
-- 1. عدد التوجيهات المكتملة
SELECT get_employee_completed_orientations_count('employee_id');

-- 2. متوسط درجات الاختبارات
SELECT get_employee_average_test_score('employee_id');

-- 3. عدد الاختبارات الناجحة
SELECT get_employee_passed_tests_count('employee_id');

-- 4. عدد الاختبارات الفاشلة
SELECT get_employee_failed_tests_count('employee_id');

-- 5. تقرير شامل
SELECT * FROM get_employee_training_report('employee_id');
```

### مثال استخدام

```typescript
// types/employee.ts
export type EmployeeOrientation = {
  id: string;
  employee_id: string;
  orientation_title: string;
  orientation_type: string;
  duration_hours: number;
  orientation_date: string;
  status: 'مجدول' | 'جاري' | 'مكتمل' | 'ملغي';
  completion_percentage: number;
};

export type EmployeeTest = {
  id: string;
  employee_id: string;
  test_title: string;
  test_type: string;
  total_score: number;
  obtained_score: number;
  passing_score: number;
  percentage: number;
  passed: boolean;
  test_date: string;
};

// actions/training-actions.ts
export async function getEmployeeOrientations(employeeId: string) {
  const { data } = await supabase
    .from('employee_orientations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('orientation_date', { ascending: false });
  
  return data;
}

export async function getEmployeeTests(employeeId: string) {
  const { data } = await supabase
    .from('employee_tests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('test_date', { ascending: false });
  
  return data;
}

export async function getTrainingReport(employeeId: string) {
  const { data } = await supabase.rpc('get_employee_training_report', {
    p_employee_id: employeeId
  });
  return data;
}
```

---

## ⚖️ Phase 5: العقوبات والخصومات

### جدول `employee_penalties`

```sql
CREATE TABLE employee_penalties (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  penalty_type TEXT,               -- 9 أنواع
  deduction_amount DECIMAL(10,2),
  penalty_title TEXT,
  penalty_description TEXT,
  
  incident_date DATE,
  incident_time TIME,
  applied_date DATE,
  
  applied_by UUID,
  status TEXT,                     -- مقترحة، مطبقة، ملغاة، معلقة
  
  requires_approval BOOLEAN,
  approved_by UUID,
  
  notes TEXT,
  employee_response TEXT           -- رد الموظف على العقوبة
);
```

### أنواع العقوبات (9 أنواع)
1. تأخير
2. غياب بدون إذن
3. خطأ في العمل
4. إهمال
5. مخالفة سلوكية
6. عدم الالتزام بالزي
7. استخدام الهاتف
8. تأخر في التسليم
9. أخرى

### جدول `penalty_rules` (14 قاعدة)

| النوع | القاعدة | المبلغ | يحتاج موافقة |
|-------|---------|--------|--------------|
| تأخير | أقل من 15 دقيقة | 10 جنيه | لا |
| تأخير | 15-30 دقيقة | 25 جنيه | لا |
| تأخير | أكثر من 30 دقيقة | 50 جنيه | نعم |
| غياب | يوم واحد | 100 جنيه | نعم |
| غياب | 3 أيام متكررة | 500 جنيه | نعم |
| خطأ | بسيط | 20 جنيه | لا |
| خطأ | متوسط | 50 جنيه | نعم |
| خطأ | جسيم | 200 جنيه | نعم |
| إهمال | في المهام | 30 جنيه | نعم |
| سلوك | مع زميل | 100 جنيه | نعم |
| سلوك | مع عميل | 200 جنيه | نعم |
| زي | عدم الالتزام | 15 جنيه | لا |
| هاتف | أثناء العمل | 25 جنيه | لا |
| تسليم | تأخر في المهام | 50 جنيه | نعم |

### الدوال (4 دوال)

```sql
-- 1. خصومات الشهر
SELECT get_employee_monthly_penalties('employee_id', 2025, 11);

-- 2. إجمالي الخصومات
SELECT get_employee_total_penalties('employee_id');

-- 3. عدد العقوبات حسب النوع
SELECT get_employee_penalties_by_type('employee_id', 'تأخير');

-- 4. تقرير شامل
SELECT * FROM get_employee_penalties_report('employee_id');
```

### مثال استخدام

```typescript
// types/employee.ts
export type EmployeePenalty = {
  id: string;
  employee_id: string;
  penalty_type: string;
  deduction_amount: number;
  penalty_title: string;
  incident_date: string;
  status: 'مقترحة' | 'مطبقة' | 'ملغاة' | 'معلقة';
  requires_approval: boolean;
  employee_response: string | null;
};

export type PenaltyRule = {
  id: string;
  penalty_type: string;
  rule_name: string;
  default_amount: number;
  calculation_method: 'مبلغ ثابت' | 'نسبة من الراتب' | 'حسب المدة';
  requires_manager_approval: boolean;
};

// actions/penalty-actions.ts
export async function getEmployeePenalties(employeeId: string) {
  const { data } = await supabase
    .from('employee_penalties')
    .select('*')
    .eq('employee_id', employeeId)
    .order('incident_date', { ascending: false });
  
  return data;
}

export async function getMonthlyPenalties(
  employeeId: string,
  year: number,
  month: number
) {
  const { data } = await supabase.rpc('get_employee_monthly_penalties', {
    p_employee_id: employeeId,
    p_year: year,
    p_month: month
  });
  return data;
}

export async function addEmployeeResponse(
  penaltyId: string,
  response: string
) {
  const { data } = await supabase
    .from('employee_penalties')
    .update({ employee_response: response })
    .eq('id', penaltyId);
  
  return data;
}
```

---

## 🏖️ Phase 6: نظام الإجازات

### جدول `leave_requests`

```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  leave_type TEXT,                 -- 6 أنواع
  start_date DATE,
  end_date DATE,
  days_count INTEGER,              -- محسوب تلقائياً
  
  reason TEXT,
  notes TEXT,
  attachments TEXT[],
  
  status TEXT,                     -- قيد المراجعة، موافق، مرفوضة، ملغاة
  
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT
);
```

### أنواع الإجازات (6 أنواع)
1. إجازة سنوية (21 يوم)
2. إجازة مرضية (15 يوم)
3. إجازة طارئة (7 أيام)
4. إجازة بدون راتب
5. إجازة رسمية
6. أخرى

### جدول `leave_balance`

```sql
CREATE TABLE leave_balance (
  id UUID PRIMARY KEY,
  employee_id UUID UNIQUE,
  
  annual_leave_total INTEGER DEFAULT 21,
  annual_leave_used INTEGER DEFAULT 0,
  annual_leave_remaining INTEGER,  -- محسوب تلقائياً
  
  sick_leave_total INTEGER DEFAULT 15,
  sick_leave_used INTEGER DEFAULT 0,
  sick_leave_remaining INTEGER,    -- محسوب تلقائياً
  
  emergency_leave_total INTEGER DEFAULT 7,
  emergency_leave_used INTEGER DEFAULT 0,
  emergency_leave_remaining INTEGER, -- محسوب تلقائياً
  
  year INTEGER
);
```

### الدوال (5 دوال)

```sql
-- 1. التحقق من الأهلية (6 شهور)
SELECT is_eligible_for_leave('employee_id');

-- 2. إنشاء رصيد للموظف الجديد
SELECT create_leave_balance_for_employee('employee_id');

-- 3. الحصول على الرصيد
SELECT * FROM get_employee_leave_balance('employee_id');

-- 4. إحصائيات الإجازات
SELECT * FROM get_employee_leave_stats('employee_id');

-- 5. التحقق من التعارض
SELECT check_leave_conflict('employee_id', '2025-12-01', '2025-12-05');
```

### Trigger تلقائي
- عند الموافقة على طلب إجازة، يتم تحديث الرصيد تلقائياً

### مثال استخدام

```typescript
// types/employee.ts
export type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'قيد المراجعة' | 'موافق عليها' | 'مرفوضة' | 'ملغاة';
  reviewed_by: string | null;
  rejection_reason: string | null;
};

export type LeaveBalance = {
  annual_leave_total: number;
  annual_leave_used: number;
  annual_leave_remaining: number;
  sick_leave_total: number;
  sick_leave_used: number;
  sick_leave_remaining: number;
  emergency_leave_total: number;
  emergency_leave_used: number;
  emergency_leave_remaining: number;
};

// actions/leave-actions.ts
export async function checkLeaveEligibility(employeeId: string) {
  const { data } = await supabase.rpc('is_eligible_for_leave', {
    p_employee_id: employeeId
  });
  return data;
}

export async function getLeaveBalance(employeeId: string) {
  const { data } = await supabase.rpc('get_employee_leave_balance', {
    p_employee_id: employeeId
  });
  return data;
}

export async function createLeaveRequest(request: {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  // 1. التحقق من الأهلية
  const eligible = await checkLeaveEligibility(request.employee_id);
  if (!eligible) {
    throw new Error('غير مؤهل للإجازات (يجب مرور 6 شهور)');
  }
  
  // 2. التحقق من التعارض
  const { data: conflict } = await supabase.rpc('check_leave_conflict', {
    p_employee_id: request.employee_id,
    p_start_date: request.start_date,
    p_end_date: request.end_date
  });
  
  if (conflict) {
    throw new Error('يوجد تعارض مع إجازة أخرى');
  }
  
  // 3. إنشاء الطلب
  const { data } = await supabase
    .from('leave_requests')
    .insert(request);
  
  return data;
}
```

---

## ⭐ Phase 7: التقييم الشهري

### جدول `employee_evaluations`

```sql
CREATE TABLE employee_evaluations (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  evaluation_month INTEGER,
  evaluation_year INTEGER,
  
  -- معايير التقييم (1-5)
  performance_score INTEGER,       -- الأداء
  commitment_score INTEGER,        -- الالتزام
  customer_service_score INTEGER,  -- خدمة العملاء
  teamwork_score INTEGER,          -- العمل الجماعي
  innovation_score INTEGER,        -- الابتكار
  
  average_score DECIMAL(3,2),      -- محسوب تلقائياً
  grade TEXT,                      -- محسوب تلقائياً
  
  -- التعليقات
  strengths TEXT,
  weaknesses TEXT,
  improvement_suggestions TEXT,
  manager_comments TEXT,
  
  evaluated_by UUID,
  status TEXT,                     -- مسودة، مكتمل، معتمد
  
  UNIQUE(employee_id, evaluation_year, evaluation_month)
);
```

### التقديرات (محسوبة تلقائياً)
- **ممتاز:** 4.5 - 5.0
- **جيد جداً:** 3.5 - 4.49
- **جيد:** 2.5 - 3.49
- **مقبول:** 1.5 - 2.49
- **ضعيف:** أقل من 1.5

### الدوال (5 دوال)

```sql
-- 1. متوسط التقييمات
SELECT get_employee_average_evaluation('employee_id');

-- 2. آخر تقييم
SELECT * FROM get_employee_latest_evaluation('employee_id');

-- 3. إحصائيات التقييمات
SELECT * FROM get_employee_evaluation_stats('employee_id');

-- 4. تقييمات السنة
SELECT * FROM get_employee_yearly_evaluations('employee_id', 2025);

-- 5. مقارنة بين شهرين
SELECT * FROM compare_employee_performance(
  'employee_id',
  10, 2025,  -- أكتوبر 2025
  11, 2025   -- نوفمبر 2025
);
```

### مثال استخدام

```typescript
// types/employee.ts
export type EmployeeEvaluation = {
  id: string;
  employee_id: string;
  evaluation_month: number;
  evaluation_year: number;
  performance_score: number;
  commitment_score: number;
  customer_service_score: number;
  teamwork_score: number;
  innovation_score: number;
  average_score: number;
  grade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
  strengths: string | null;
  weaknesses: string | null;
  improvement_suggestions: string | null;
  manager_comments: string | null;
  status: 'مسودة' | 'مكتمل' | 'معتمد';
};

// actions/evaluation-actions.ts
export async function getEmployeeEvaluations(employeeId: string) {
  const { data } = await supabase
    .from('employee_evaluations')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'معتمد')
    .order('evaluation_year', { ascending: false })
    .order('evaluation_month', { ascending: false });
  
  return data;
}

export async function getLatestEvaluation(employeeId: string) {
  const { data } = await supabase.rpc('get_employee_latest_evaluation', {
    p_employee_id: employeeId
  });
  return data;
}

export async function getEvaluationStats(employeeId: string) {
  const { data } = await supabase.rpc('get_employee_evaluation_stats', {
    p_employee_id: employeeId
  });
  return data;
}

export async function comparePerformance(
  employeeId: string,
  month1: number,
  year1: number,
  month2: number,
  year2: number
) {
  const { data } = await supabase.rpc('compare_employee_performance', {
    p_employee_id: employeeId,
    p_month1: month1,
    p_year1: year1,
    p_month2: month2,
    p_year2: year2
  });
  return data;
}
```

---

## 🔒 Row Level Security (RLS)

جميع الجداول محمية بـ RLS Policies:

### سياسات الموظفين
```sql
-- الموظف يرى بياناته فقط
CREATE POLICY "employees_view_own" ON table_name
  FOR SELECT TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ));
```

### سياسات المدراء
```sql
-- المدراء يرون كل البيانات
CREATE POLICY "managers_view_all" ON table_name
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
    AND employee_type_id IN (
      SELECT id FROM employee_types
      WHERE name IN ('مدير قسم فني', 'مدير عام')
    )
  ));
```

---

## 📁 ملفات Migration

جميع الـ migrations موجودة في:
```
/supabase/migrations/
├── 20251119000001_expand_employee_data.sql
├── 20251119000002_employee_documents.sql
├── 20251119000003_incentive_rules.sql
├── 20251119000004_orientations_and_tests.sql
├── 20251119000005_penalties_and_deductions.sql
├── 20251119000006_leave_system.sql
└── 20251119000007_monthly_evaluation.sql
```

---

## 🚀 خطوات التطبيق

### 1. تطبيق Migrations على Supabase

```bash
# في Supabase Dashboard > SQL Editor
# شغل كل migration بالترتيب
```

### 2. إنشاء Storage Bucket للمستندات

```sql
-- في Supabase Dashboard > Storage
-- أنشئ bucket جديد اسمه: employee-documents
-- اضبط policies للسماح للموظفين برفع ملفاتهم
```

### 3. تحديث Types في المشروع

```typescript
// src/types/employee.ts
// أضف كل الـ types الموجودة في هذا الملف
```

### 4. إنشاء Server Actions

```typescript
// src/app/actions/
// أنشئ ملفات:
// - document-actions.ts
// - training-actions.ts
// - penalty-actions.ts
// - leave-actions.ts
// - evaluation-actions.ts
```

---

## 📊 Dashboard الموظف - الخطوات المقترحة

### Header الجديد

```typescript
// components/employee/EmployeeHeader.tsx
export function EmployeeHeader({ employeeId }: { employeeId: string }) {
  const [dailySalary, setDailySalary] = useState(0);
  const [dailyIncentives, setDailyIncentives] = useState(0);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const salary = await getEmployeeDailySalary(employeeId);
    const incentives = await getTotalFixedIncentives(employeeId);
    setDailySalary(salary);
    setDailyIncentives(incentives / 30); // حوافز يومية
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>الراتب اليومي</CardHeader>
        <CardContent>{dailySalary} جنيه</CardContent>
      </Card>
      <Card>
        <CardHeader>الحوافز اليومية</CardHeader>
        <CardContent>{dailyIncentives} جنيه</CardContent>
      </Card>
      <Card>
        <CardHeader>الإجمالي</CardHeader>
        <CardContent>{dailySalary + dailyIncentives} جنيه</CardContent>
      </Card>
    </div>
  );
}
```

### صفحات مقترحة

```
/employee/dashboard          - الرئيسية
/employee/profile            - بياناتي
/employee/documents          - مستنداتي
/employee/incentives         - حوافزي
/employee/training           - توجيهاتي واختباراتي
/employee/penalties          - عقوباتي
/employee/leave              - إجازاتي
/employee/evaluations        - تقييماتي
```

---

## ✅ الخلاصة

تم إنشاء نظام شامل لإدارة الموظفين يتضمن:

- ✅ **9 جداول جديدة** بحقول محسوبة تلقائياً
- ✅ **24 دالة SQL** للتقارير والإحصائيات
- ✅ **7 migrations** جاهزة للتطبيق
- ✅ **RLS Policies** لحماية البيانات
- ✅ **Triggers تلقائية** لتحديث البيانات
- ✅ **أمثلة TypeScript** للاستخدام

**الخطوة التالية:** ربط Frontend بالـ Backend باستخدام الأمثلة المرفقة.
