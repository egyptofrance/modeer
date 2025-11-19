'use client';

import { useEffect, useState } from 'react';
import { getEmployeeByUserId } from '@/app/actions/employee-actions';
import {
  getLeaveBalance,
  getLeaveRequests,
  createLeaveRequest,
  checkLeaveEligibility,
} from '@/app/actions/employee-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const LEAVE_TYPES = [
  { value: 'إجازة سنوية', label: 'إجازة سنوية' },
  { value: 'إجازة مرضية', label: 'إجازة مرضية' },
  { value: 'إجازة طارئة', label: 'إجازة طارئة' },
  { value: 'إجازة بدون راتب', label: 'إجازة بدون راتب' },
  { value: 'إجازة رسمية', label: 'إجازة رسمية' },
  { value: 'أخرى', label: 'أخرى' },
];

export default function EmployeeLeavePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const empResult = await getEmployeeByUserId();

      if (empResult?.data) {
        const emp = empResult.data as any;
        setEmployee(emp);

        // Check eligibility
        const eligibleResult = await checkLeaveEligibility(emp.id);
        if (eligibleResult?.data !== null) {
          setIsEligible(eligibleResult.data);
        }

        // Load balance
        const balanceResult = await getLeaveBalance(emp.id);
        if (balanceResult?.data) {
          setBalance(balanceResult.data[0]); // Returns array with one row
        }

        // Load requests
        const requestsResult = await getLeaveRequests(emp.id);
        if (requestsResult?.data) {
          setRequests(requestsResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employee) return;

    if (!isEligible) {
      toast.error('غير مؤهل للإجازات (يجب مرور 6 شهور من التعيين)');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createLeaveRequest({
        employee_id: employee.id,
        ...formData,
      });

      if (result?.data) {
        toast.success('تم إرسال طلب الإجازة بنجاح');
        setFormData({
          leave_type: '',
          start_date: '',
          end_date: '',
          reason: '',
          notes: '',
        });
        setShowForm(false);
        loadData(); // Reload
      } else if (result?.error) {
        toast.error(result.error.message || 'فشل إرسال الطلب');
      }
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">لم يتم العثور على بيانات الموظف</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">إجازاتي</h1>
        {!showForm && isEligible && (
          <Button onClick={() => setShowForm(true)}>
            <Calendar className="w-4 h-4 ml-2" />
            طلب إجازة جديدة
          </Button>
        )}
      </div>

      {/* Eligibility Status */}
      {!isEligible && (
        <Card className="border-orange-500">
          <CardContent className="pt-6">
            <div className="text-orange-600 font-medium">
              ⚠ غير مؤهل للإجازات حالياً (يجب مرور 6 شهور من تاريخ التعيين)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Balance */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الإجازة السنوية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance.annual_leave_remaining || 0} يوم
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                من أصل {balance.annual_leave_total || 0} يوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الإجازة المرضية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance.sick_leave_remaining || 0} يوم
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                من أصل {balance.sick_leave_total || 0} يوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الإجازة الطارئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance.emergency_leave_remaining || 0} يوم
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                من أصل {balance.emergency_leave_total || 0} يوم
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>طلب إجازة جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">تاريخ البداية *</Label>
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
                  <Label htmlFor="end_date">تاريخ النهاية *</Label>
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
                <Label htmlFor="reason">السبب *</Label>
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

              <div>
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="ملاحظات اختيارية..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات الإجازات ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{request.leave_type}</span>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      من {new Date(request.start_date).toLocaleDateString('ar-EG')}{' '}
                      إلى {new Date(request.end_date).toLocaleDateString('ar-EG')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      عدد الأيام: {request.days_count} يوم
                    </p>
                    <p className="text-sm mt-2">{request.reason}</p>
                    {request.rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">
                        سبب الرفض: {request.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">لا توجد طلبات إجازات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    'قيد المراجعة': { variant: 'secondary', icon: Clock },
    'موافق عليها': { variant: 'default', icon: CheckCircle },
    مرفوضة: { variant: 'destructive', icon: XCircle },
    ملغاة: { variant: 'outline', icon: XCircle },
  };

  const config = variants[status] || variants['قيد المراجعة'];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3 h-3 ml-1" />
      {status}
    </Badge>
  );
}
