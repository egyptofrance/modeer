# دليل المطور - نظام إدارة الموظفين الموسع

## 🎯 نظرة سريعة

تم توسيع نظام إدارة الموظفين بـ **7 أنظمة فرعية** تشمل 9 جداول جديدة و24 دالة SQL.

---

## 📦 الملفات المهمة

| الملف | الوصف |
|-------|-------|
| `EMPLOYEE_SYSTEM_EXTENDED_DOCUMENTATION.md` | التوثيق الشامل مع أمثلة TypeScript |
| `ALL_MIGRATIONS_COMBINED.sql` | كل الـ migrations في ملف واحد (1610 سطر) |
| `supabase/migrations/20251119000001-7_*.sql` | Migrations منفصلة (7 ملفات) |
| `TODO.md` | قائمة المهام المكتملة والمتبقية |

---

## 🚀 خطوات التطبيق السريعة

### 1. تطبيق Migrations

**الطريقة الأولى: ملف واحد**
```bash
# في Supabase Dashboard > SQL Editor
# افتح ملف ALL_MIGRATIONS_COMBINED.sql
# انسخ المحتوى والصقه وشغّل
```

**الطريقة الثانية: ملفات منفصلة**
```bash
# شغّل كل migration بالترتيب:
20251119000001_expand_employee_data.sql
20251119000002_employee_documents.sql
20251119000003_incentive_rules.sql
20251119000004_orientations_and_tests.sql
20251119000005_penalties_and_deductions.sql
20251119000006_leave_system.sql
20251119000007_monthly_evaluation.sql
```

### 2. إنشاء Storage Bucket

```sql
-- في Supabase Dashboard > Storage
-- أنشئ bucket جديد:
-- Name: employee-documents
-- Public: false

-- ثم أضف Policy:
CREATE POLICY "Employees can upload their documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can view their documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM employees WHERE user_id = auth.uid()
  )
);
```

### 3. تحديث Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📝 إنشاء Server Actions

### ملف: `src/app/actions/employee-extended-actions.ts`

```typescript
'use server';

import { createServerClient } from '@/supabase-clients/server';

// ==================== بيانات الموظف ====================

export async function getEmployeeDailySalary(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('calculate_daily_salary', {
    p_employee_id: employeeId
  });
  if (error) throw error;
  return data;
}

export async function checkLeaveEligibility(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('is_eligible_for_leave', {
    p_employee_id: employeeId
  });
  if (error) throw error;
  return data;
}

// ==================== المستندات ====================

export async function getEmployeeDocuments(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function uploadDocument(
  employeeId: string,
  documentType: string,
  file: File
) {
  const supabase = await createServerClient();
  
  // رفع الملف
  const filePath = `${employeeId}/${documentType}_${Date.now()}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('employee-documents')
    .upload(filePath, file);
  
  if (uploadError) throw uploadError;
  
  // تحديث الجدول
  const { data, error } = await supabase
    .from('employee_documents')
    .upsert({
      employee_id: employeeId,
      [documentType]: uploadData.path
    });
  
  if (error) throw error;
  return data;
}

// ==================== الحوافز المقررة ====================

export async function getEmployeeIncentiveRules(employeeId: string) {
  const supabase = await createServerClient();
  
  // الحصول على نوع الوظيفة
  const { data: employee } = await supabase
    .from('employees')
    .select('employee_type_id')
    .eq('id', employeeId)
    .single();
  
  if (!employee) return [];
  
  // الحصول على الحوافز
  const { data, error } = await supabase
    .from('incentive_rules')
    .select('*')
    .eq('employee_type_id', employee.employee_type_id)
    .eq('is_active', true);
  
  if (error) throw error;
  return data;
}

export async function getTotalFixedIncentives(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_total_incentives', {
    p_employee_id: employeeId
  });
  if (error) throw error;
  return data;
}

// ==================== التوجيهات ====================

export async function getEmployeeOrientations(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_orientations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('orientation_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getCompletedOrientationsCount(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_completed_orientations_count',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

// ==================== الاختبارات ====================

export async function getEmployeeTests(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_tests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('test_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getAverageTestScore(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_average_test_score',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

export async function getTrainingReport(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_training_report',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

// ==================== العقوبات ====================

export async function getEmployeePenalties(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .select('*')
    .eq('employee_id', employeeId)
    .order('incident_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getMonthlyPenalties(
  employeeId: string,
  year: number,
  month: number
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_monthly_penalties',
    { p_employee_id: employeeId, p_year: year, p_month: month }
  );
  if (error) throw error;
  return data;
}

export async function addPenaltyResponse(
  penaltyId: string,
  response: string
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .update({ employee_response: response })
    .eq('id', penaltyId);
  
  if (error) throw error;
  return data;
}

export async function getPenaltiesReport(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_penalties_report',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

// ==================== الإجازات ====================

export async function getLeaveBalance(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_leave_balance',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

export async function getLeaveRequests(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createLeaveRequest(request: {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  const supabase = await createServerClient();
  
  // التحقق من الأهلية
  const eligible = await checkLeaveEligibility(request.employee_id);
  if (!eligible) {
    throw new Error('غير مؤهل للإجازات (يجب مرور 6 شهور من التعيين)');
  }
  
  // التحقق من التعارض
  const { data: conflict } = await supabase.rpc('check_leave_conflict', {
    p_employee_id: request.employee_id,
    p_start_date: request.start_date,
    p_end_date: request.end_date
  });
  
  if (conflict) {
    throw new Error('يوجد تعارض مع طلب إجازة آخر');
  }
  
  // إنشاء الطلب
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(request)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getLeaveStats(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_leave_stats',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

// ==================== التقييمات ====================

export async function getEmployeeEvaluations(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_evaluations')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'معتمد')
    .order('evaluation_year', { ascending: false })
    .order('evaluation_month', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getLatestEvaluation(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_latest_evaluation',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

export async function getAverageEvaluation(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_average_evaluation',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

export async function getEvaluationStats(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_evaluation_stats',
    { p_employee_id: employeeId }
  );
  if (error) throw error;
  return data;
}

export async function comparePerformance(
  employeeId: string,
  month1: number,
  year1: number,
  month2: number,
  year2: number
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'compare_employee_performance',
    {
      p_employee_id: employeeId,
      p_month1: month1,
      p_year1: year1,
      p_month2: month2,
      p_year2: year2
    }
  );
  if (error) throw error;
  return data;
}
```

---

## 🎨 مثال Component: Employee Header

### ملف: `src/components/employee/EmployeeHeader.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getEmployeeDailySalary,
  getTotalFixedIncentives,
} from '@/app/actions/employee-extended-actions';

export function EmployeeHeader({ employeeId }: { employeeId: string }) {
  const [dailySalary, setDailySalary] = useState<number>(0);
  const [monthlyIncentives, setMonthlyIncentives] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const loadData = async () => {
    try {
      const [salary, incentives] = await Promise.all([
        getEmployeeDailySalary(employeeId),
        getTotalFixedIncentives(employeeId),
      ]);
      
      setDailySalary(salary || 0);
      setMonthlyIncentives(incentives || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dailyIncentives = monthlyIncentives / 30;
  const dailyTotal = dailySalary + dailyIncentives;

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            الراتب اليومي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dailySalary.toFixed(2)} جنيه</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            الحوافز اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dailyIncentives.toFixed(2)} جنيه</div>
          <p className="text-xs text-muted-foreground mt-1">
            ({monthlyIncentives.toFixed(2)} جنيه شهرياً)
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            الإجمالي اليومي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {dailyTotal.toFixed(2)} جنيه
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ملحوظة: قيمة الحافز تحدد على أساس نتيجة الاختبار/KPIs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎨 مثال Component: Leave Request Form

### ملف: `src/components/employee/LeaveRequestForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createLeaveRequest } from '@/app/actions/employee-extended-actions';
import { toast } from 'sonner';

export function LeaveRequestForm({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createLeaveRequest({
        employee_id: employeeId,
        ...formData,
      });
      
      toast.success('تم إرسال طلب الإجازة بنجاح');
      
      // Reset form
      setFormData({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="leave_type">نوع الإجازة</Label>
        <Select
          value={formData.leave_type}
          onValueChange={(value) =>
            setFormData({ ...formData, leave_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع الإجازة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="إجازة سنوية">إجازة سنوية</SelectItem>
            <SelectItem value="إجازة مرضية">إجازة مرضية</SelectItem>
            <SelectItem value="إجازة طارئة">إجازة طارئة</SelectItem>
            <SelectItem value="إجازة بدون راتب">إجازة بدون راتب</SelectItem>
            <SelectItem value="أخرى">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">تاريخ البداية</Label>
          <Input
            type="date"
            id="start_date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="end_date">تاريخ النهاية</Label>
          <Input
            type="date"
            id="end_date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reason">السبب</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) =>
            setFormData({ ...formData, reason: e.target.value })
          }
          placeholder="اكتب سبب طلب الإجازة..."
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
      </Button>
    </form>
  );
}
```

---

## 📋 قائمة المهام المتبقية

### Frontend Tasks

- [ ] تحديث `src/types/employee.ts` بكل الـ types الجديدة
- [ ] إنشاء `src/app/actions/employee-extended-actions.ts`
- [ ] إنشاء `src/components/employee/EmployeeHeader.tsx`
- [ ] إنشاء صفحة `/employee/profile` - بياناتي
- [ ] إنشاء صفحة `/employee/documents` - مستنداتي
- [ ] إنشاء صفحة `/employee/incentives` - حوافزي المقررة
- [ ] إنشاء صفحة `/employee/training` - توجيهاتي واختباراتي
- [ ] إنشاء صفحة `/employee/penalties` - عقوباتي
- [ ] إنشاء صفحة `/employee/leave` - إجازاتي
- [ ] إنشاء صفحة `/employee/evaluations` - تقييماتي

### Admin Tasks

- [ ] إنشاء صفحة `/admin/documents` - إدارة المستندات
- [ ] إنشاء صفحة `/admin/incentive-rules` - إدارة الحوافز
- [ ] إنشاء صفحة `/admin/training` - إدارة التوجيهات والاختبارات
- [ ] إنشاء صفحة `/admin/penalties` - إدارة العقوبات
- [ ] إنشاء صفحة `/admin/leave` - إدارة طلبات الإجازات
- [ ] إنشاء صفحة `/admin/evaluations` - إدارة التقييمات

---

## 🔍 اختبار سريع

### اختبار الدوال في SQL Editor

```sql
-- 1. اختبار حساب الراتب اليومي
SELECT calculate_daily_salary('employee_id_here');

-- 2. اختبار التحقق من الأهلية
SELECT is_eligible_for_leave('employee_id_here');

-- 3. اختبار اكتمال المستندات
SELECT check_documents_complete('employee_id_here');

-- 4. اختبار إجمالي الحوافز
SELECT get_employee_total_incentives('employee_id_here');

-- 5. اختبار تقرير التدريب
SELECT * FROM get_employee_training_report('employee_id_here');

-- 6. اختبار تقرير العقوبات
SELECT * FROM get_employee_penalties_report('employee_id_here');

-- 7. اختبار رصيد الإجازات
SELECT * FROM get_employee_leave_balance('employee_id_here');

-- 8. اختبار آخر تقييم
SELECT * FROM get_employee_latest_evaluation('employee_id_here');
```

---

## 📞 الدعم

للأسئلة أو المساعدة، راجع:
- `EMPLOYEE_SYSTEM_EXTENDED_DOCUMENTATION.md` - التوثيق الشامل
- `TODO.md` - قائمة المهام
- Supabase Docs: https://supabase.com/docs

---

**تم إنشاء هذا الدليل بواسطة:** Manus AI  
**التاريخ:** 19 نوفمبر 2025  
**الإصدار:** 1.0
