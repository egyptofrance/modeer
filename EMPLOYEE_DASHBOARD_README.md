# 📊 Dashboard الموظف - دليل الاستخدام

## 🎯 نظرة عامة

تم إنشاء **5 صفحات كاملة** لـ Dashboard الموظف مع التكامل الكامل مع قاعدة البيانات.

---

## 📄 الصفحات المُنشأة

### 1. **بياناتي** (`/employee/profile`)
**المسار:** `src/app/[locale]/(dynamic-pages)/(authenticated-pages)/employee/profile/page.tsx`

**المميزات:**
- ✅ عرض الراتب اليومي (محسوب تلقائياً)
- ✅ عرض الحوافز الشهرية واليومية
- ✅ الإجمالي اليومي (راتب + حوافز)
- ✅ المعلومات الشخصية الكاملة
- ✅ المؤهلات الدراسية
- ✅ حساب مدة العمل تلقائياً

**Server Actions المستخدمة:**
- `getEmployeeByUserId()`
- `getEmployeeExtendedData(employeeId)`
- `getEmployeeDailySalary(employeeId)`
- `getTotalFixedIncentives(employeeId)`

---

### 2. **مستنداتي** (`/employee/documents`)
**المسار:** `src/app/[locale]/(dynamic-pages)/(authenticated-pages)/employee/documents/page.tsx`

**المميزات:**
- ✅ رفع 7 مستندات مطلوبة
- ✅ تحميل إلى Supabase Storage
- ✅ عرض حالة الاكتمال
- ✅ عرض المستندات المرفوعة
- ✅ تحديث المستندات
- ✅ ملاحظات الإدارة

**المستندات المطلوبة:**
1. صورة البطاقة (وجه) *
2. صورة البطاقة (ظهر) *
3. إيصال مرافق *
4. شهادة الميلاد *
5. المؤهل الدراسي *
6. شهادة التجنيد (للذكور فقط)
7. صورة Application *

**Server Actions المستخدمة:**
- `getEmployeeDocuments(employeeId)`
- `uploadDocument({ employeeId, documentType, filePath })`
- `checkDocumentsComplete(employeeId)`

**ملاحظة:** يجب إنشاء Bucket في Supabase Storage باسم `employee-documents`

---

### 3. **إجازاتي** (`/employee/leave`)
**المسار:** `src/app/[locale]/(dynamic-pages)/(authenticated-pages)/employee/leave/page.tsx`

**المميزات:**
- ✅ عرض رصيد الإجازات (سنوية، مرضية، طارئة)
- ✅ طلب إجازة جديدة
- ✅ التحقق من الأهلية (6 شهور)
- ✅ منع التعارض بين الطلبات
- ✅ عرض حالة الطلبات (قيد المراجعة، موافق، مرفوض)
- ✅ عرض سبب الرفض

**أنواع الإجازات:**
1. إجازة سنوية (21 يوم)
2. إجازة مرضية (15 يوم)
3. إجازة طارئة (7 أيام)
4. إجازة بدون راتب
5. إجازة رسمية
6. أخرى

**Server Actions المستخدمة:**
- `checkLeaveEligibility(employeeId)`
- `getLeaveBalance(employeeId)`
- `getLeaveRequests(employeeId)`
- `createLeaveRequest({ employee_id, leave_type, start_date, end_date, reason, notes })`

---

### 4. **تقييماتي** (`/employee/evaluations`)
**المسار:** `src/app/[locale]/(dynamic-pages)/(authenticated-pages)/employee/evaluations/page.tsx`

**المميزات:**
- ✅ عرض المتوسط العام للتقييمات
- ✅ عرض آخر تقييم بالتفصيل
- ✅ 5 معايير تقييم (1-5)
- ✅ سجل التقييمات الشهرية
- ✅ التقدير (ممتاز، جيد جداً، جيد، مقبول، ضعيف)
- ✅ ملاحظات المدير

**معايير التقييم:**
1. الأداء
2. الالتزام
3. خدمة العملاء
4. العمل الجماعي
5. الابتكار

**Server Actions المستخدمة:**
- `getEmployeeEvaluations(employeeId)`
- `getLatestEvaluation(employeeId)`
- `getAverageEvaluation(employeeId)`

---

### 5. **التدريب والاختبارات** (`/employee/training`)
**المسار:** `src/app/[locale]/(dynamic-pages)/(authenticated-pages)/employee/training/page.tsx`

**المميزات:**
- ✅ عرض التوجيهات المكتملة
- ✅ عرض الاختبارات المتاحة
- ✅ إجراء الاختبارات (سؤال + 4 اختيارات)
- ✅ حساب النتيجة تلقائياً
- ✅ عرض متوسط الدرجات
- ✅ حالة النجاح/الرسوب

**Server Actions المستخدمة:**
- `getEmployeeOrientations(employeeId)`
- `getEmployeeTests(employeeId)`
- `getAverageTestScore(employeeId)`
- `submitTestAnswers({ employee_id, test_title, test_type, score_obtained, total_score, test_date, answers })`

---

## 🔧 التثبيت والإعداد

### 1. Server Actions
الملف موجود في: `src/app/actions/employee-extended-actions.ts`

يحتوي على **24 دالة** جاهزة للاستخدام.

### 2. Supabase Storage
يجب إنشاء Bucket جديد:

```sql
-- في Supabase Dashboard > Storage > New Bucket
Name: employee-documents
Public: true (أو false حسب الحاجة)
```

**RLS Policies للـ Storage:**
```sql
-- السماح للموظفين برفع مستنداتهم
CREATE POLICY "Employees can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.employees WHERE user_id = auth.uid()
  )
);

-- السماح للموظفين بعرض مستنداتهم
CREATE POLICY "Employees can view their documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.employees WHERE user_id = auth.uid()
  )
);

-- السماح للمديرين بعرض كل المستندات
CREATE POLICY "Managers can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() 
    AND employee_type_id IN (
      SELECT id FROM public.employee_types 
      WHERE name IN ('مدير قسم فني', 'مدير عام')
    )
  )
);
```

### 3. التنقل (Navigation)
أضف الروابط التالية إلى Navigation Menu:

```tsx
const employeeLinks = [
  { href: '/employee/profile', label: 'بياناتي', icon: User },
  { href: '/employee/documents', label: 'مستنداتي', icon: FileText },
  { href: '/employee/leave', label: 'إجازاتي', icon: Calendar },
  { href: '/employee/evaluations', label: 'تقييماتي', icon: Star },
  { href: '/employee/training', label: 'التدريب', icon: BookOpen },
];
```

---

## 🎨 المكونات المستخدمة

جميع الصفحات تستخدم مكونات **shadcn/ui** الموجودة في القالب:

- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`
- `Input`, `Textarea`, `Label`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Badge`
- `Progress`
- `RadioGroup`, `RadioGroupItem`
- `toast` (من sonner)

---

## 📊 البيانات التجريبية

لاختبار الصفحات، يمكنك إضافة بيانات تجريبية:

### إضافة توجيه:
```sql
INSERT INTO public.employee_orientations (
  employee_id, orientation_title, orientation_description, 
  orientation_type, duration_hours, orientation_date, 
  conducted_by_name, status
) VALUES (
  'EMPLOYEE_ID_HERE', 
  'التعريف بسياسات الشركة', 
  'شرح سياسات العمل والإجراءات',
  'سياسات العمل',
  2.5,
  CURRENT_DATE,
  'أحمد محمد',
  'مكتمل'
);
```

### إضافة اختبار:
```sql
INSERT INTO public.employee_tests (
  employee_id, test_title, test_type, test_date,
  questions, status
) VALUES (
  'EMPLOYEE_ID_HERE',
  'اختبار السلامة المهنية',
  'اختبار تدريبي',
  CURRENT_DATE,
  '[
    {
      "question": "ما هي أهم قواعد السلامة في مكان العمل؟",
      "options": ["ارتداء معدات الحماية", "تجاهل التعليمات", "العمل بسرعة", "عدم الاهتمام"],
      "correct_answer": "ارتداء معدات الحماية"
    },
    {
      "question": "ماذا تفعل عند حدوث حريق؟",
      "options": ["الهروب فوراً", "استخدام طفاية الحريق", "الاتصال بالإدارة", "الانتظار"],
      "correct_answer": "استخدام طفاية الحريق"
    }
  ]'::jsonb,
  'مجدول'
);
```

### إضافة تقييم:
```sql
INSERT INTO public.employee_evaluations (
  employee_id, evaluation_month, evaluation_year,
  performance_score, commitment_score, customer_service_score,
  teamwork_score, innovation_score, status, evaluated_by_name
) VALUES (
  'EMPLOYEE_ID_HERE',
  11, 2025,
  4, 5, 4, 4, 3,
  'معتمد', 'مدير القسم'
);
```

---

## 🚀 الخطوات التالية

### للموظف:
1. تسجيل الدخول
2. الانتقال إلى Dashboard
3. استكمال المستندات
4. إجراء الاختبارات
5. طلب الإجازات

### للأدمن (المرحلة القادمة):
- [ ] صفحة إدارة الموظفين
- [ ] صفحة موافقات الإجازات
- [ ] صفحة إضافة التقييمات
- [ ] صفحة إضافة التوجيهات والاختبارات
- [ ] صفحة إدارة العقوبات
- [ ] التقارير الشاملة

---

## 📝 ملاحظات مهمة

1. **الأمان:** جميع الصفحات محمية بـ RLS Policies
2. **الأداء:** استخدام Server Actions للتحميل السريع
3. **التجربة:** واجهة مستخدم احترافية مع shadcn/ui
4. **التكامل:** متوافق 100% مع Nextbase Pro template
5. **العربية:** جميع النصوص بالعربية مع دعم RTL

---

## 🎊 الإنجاز

✅ **5 صفحات كاملة**
✅ **24 Server Action**
✅ **7 أنظمة فرعية**
✅ **قاعدة بيانات شاملة**
✅ **واجهة احترافية**

**Dashboard الموظف جاهز للاستخدام! 🚀**
