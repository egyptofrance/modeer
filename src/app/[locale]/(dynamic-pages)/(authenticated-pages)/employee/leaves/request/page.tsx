'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeaveRequest } from '@/app/actions/employee-extended-actions';
import { getEmployeeData } from '@/app/actions/employee-extended-actions';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, Calendar, Loader2, Send } from 'lucide-react';
import { supabaseUserClientComponent as createClient } from '@/supabase-clients/user/supabaseUserClientComponent';

export default function LeaveRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    substitute_employee_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current employee
      const employeeResult = await getEmployeeData();
      if (employeeResult.data) {
        setCurrentEmployee(employeeResult.data as any);
      }

      // Get all employees for substitute selection
      const supabase = createClient;
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, employee_code')
        .eq('is_active', true)
        .order('full_name');

      if (data) {
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leave_type) {
      toast.error('يرجى اختيار نوع الإجازة');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }

    if (!formData.reason) {
      toast.error('يرجى كتابة سبب الإجازة');
      return;
    }

    if (!formData.substitute_employee_id) {
      toast.error('يرجى اختيار الموظف البديل');
      return;
    }

    setLoading(true);

    try {
      const substituteEmployee = employees.find(
        (emp) => emp.id === formData.substitute_employee_id
      );

      const result = await createLeaveRequest({
        employee_id: currentEmployee?.id || '',
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        substitute_employee_id: formData.substitute_employee_id,
        substitute_employee_name: substituteEmployee?.full_name || '',
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('تم تقديم طلب الإجازة بنجاح!');
        router.push('/employee/leaves');
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast.error('حدث خطأ أثناء تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const daysCount = calculateDays();

  return (
    <div className="container mx-auto py-8 max-w-3xl" dir="rtl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowRight className="w-4 h-4 ml-2" />
        رجوع
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            تقديم طلب إجازة
          </CardTitle>
          <CardDescription>
            املأ النموذج أدناه لتقديم طلب إجازة جديد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* نوع الإجازة */}
            <div className="space-y-2">
              <Label htmlFor="leave_type">نوع الإجازة *</Label>
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
                  <SelectItem value="إجازة بدون راتب">
                    إجازة بدون راتب
                  </SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* التواريخ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">من تاريخ *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">إلى تاريخ *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* عدد الأيام */}
            {daysCount > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium">
                  عدد أيام الإجازة:{' '}
                  <span className="text-lg font-bold text-blue-600">
                    {daysCount} يوم
                  </span>
                </p>
              </div>
            )}

            {/* الموظف البديل */}
            <div className="space-y-2">
              <Label htmlFor="substitute_employee_id">
                الموظف البديل *
              </Label>
              <Select
                value={formData.substitute_employee_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, substitute_employee_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف البديل" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.id !== currentEmployee?.id)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                اختر الموظف الذي سيقوم بعملك أثناء الإجازة
              </p>
            </div>

            {/* السبب */}
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الإجازة *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
                rows={4}
                placeholder="اكتب سبب طلب الإجازة..."
              />
            </div>

            {/* ملاحظة */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>ملاحظة:</strong> سيتم إرسال طلبك إلى المدير العام
                للموافقة عليه. ستتلقى إشعاراً عند الموافقة أو الرفض.
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    تقديم الطلب
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
