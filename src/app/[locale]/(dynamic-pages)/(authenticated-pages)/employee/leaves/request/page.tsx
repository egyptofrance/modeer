'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getEmployeeData,
  createLeaveRequest,
} from '@/app/actions/employee-extended-actions';
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

export default function LeaveRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    substitute_employee_name: '',
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const employeeResult = await getEmployeeData();
      if (employeeResult.data) {
        setCurrentEmployee(employeeResult.data as any);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEmployee) {
      toast.error('لم يتم العثور على بيانات الموظف');
      return;
    }

    if (
      !formData.leave_type ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.reason ||
      !formData.substitute_employee_name
    ) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const daysCount = calculateDays();
    if (daysCount <= 0) {
      toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }

    setLoading(true);
    try {
      const result = await createLeaveRequest({
        employee_id: currentEmployee.id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        substitute_employee_name: formData.substitute_employee_name,
      });

      if (result.error) {
        const err: any = result.error;
        toast.error(typeof err === 'string' ? err : err?.message || 'حدث خطأ');
      } else {
        toast.success('تم تقديم طلب الإجازة بنجاح!');
        router.push('/employee/leaves');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('حدث خطأ أثناء تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            تقديم طلب إجازة
          </CardTitle>
          <CardDescription>
            املأ النموذج التالي لتقديم طلب إجازة جديد
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
                  <SelectItem value="إجازة بدون مرتب">
                    إجازة بدون مرتب
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تاريخ البداية */}
            <div className="space-y-2">
              <Label htmlFor="start_date">تاريخ البداية *</Label>
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

            {/* تاريخ النهاية */}
            <div className="space-y-2">
              <Label htmlFor="end_date">تاريخ النهاية *</Label>
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

            {/* عدد الأيام */}
            {formData.start_date && formData.end_date && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  عدد أيام الإجازة: {calculateDays()} يوم
                </p>
              </div>
            )}

            {/* الموظف البديل */}
            <div className="space-y-2">
              <Label htmlFor="substitute_employee_name">
                اسم الموظف البديل *
              </Label>
              <Input
                id="substitute_employee_name"
                type="text"
                placeholder="اكتب اسم الموظف البديل"
                value={formData.substitute_employee_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    substitute_employee_name: e.target.value,
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                اكتب اسم الموظف الذي سيقوم بتغطية عملك أثناء الإجازة
              </p>
            </div>

            {/* السبب */}
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الإجازة *</Label>
              <Textarea
                id="reason"
                rows={4}
                placeholder="اكتب سبب طلب الإجازة..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
              />
            </div>

            {/* الأزرار */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التقديم...
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
