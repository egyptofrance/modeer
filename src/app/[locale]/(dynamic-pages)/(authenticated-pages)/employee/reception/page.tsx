'use client';

import { useEffect, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import {
  getEmployeeByUserId,
  getEmployeeDailyTotal,
} from '@/app/actions/employee-actions';
import {
  markCustomerAsVisited,
  getCustomerByCode,
} from '@/app/actions/customer-actions';
import { createDevice } from '@/app/actions/device-actions';
import { getTodayIncentivesByEmployee } from '@/app/actions/incentive-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ReceptionDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [dailyTotal, setDailyTotal] = useState<any>(null);
  const [todayIncentives, setTodayIncentives] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [customerCode, setCustomerCode] = useState('');
  const [deviceForm, setDeviceForm] = useState({
    device_type: '',
    brand: '',
    model: '',
    serial_number: '',
    problem_description: '',
    estimated_cost: '',
  });

  // Actions
  const { execute: executeGetDailyTotal } = useAction(getEmployeeDailyTotal);
  const { execute: executeGetTodayIncentives } = useAction(
    getTodayIncentivesByEmployee
  );
  const { execute: executeGetCustomer, isExecuting: isSearchingCustomer } =
    useAction(getCustomerByCode);
  const { execute: executeMarkVisited, isExecuting: isMarkingVisited } =
    useAction(markCustomerAsVisited);
  const { execute: executeCreateDevice, isExecuting: isCreatingDevice } =
    useAction(createDevice);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      const empResult = await getEmployeeByUserId();
      
      if (empResult?.data?.success && empResult?.data?.data) {
        const emp = empResult.data.data;
        setEmployee(emp);

        // Load daily total
        const dailyResult = await executeGetDailyTotal({ employee_id: emp.id });
        if (dailyResult?.data?.success) {
          setDailyTotal(dailyResult.data.data);
        }

        // Load today's incentives
        const incentivesResult = await executeGetTodayIncentives({
          employee_id: emp.id,
        });
        if (incentivesResult?.data?.success) {
          setTodayIncentives(incentivesResult.data.data);
        }
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCode.trim()) return;

    const result = await executeGetCustomer({ customer_code: customerCode });
    if (result?.data?.success) {
      setCustomer(result.data.data);
      toast.success('تم العثور على العميل');
    } else {
      toast.error('لم يتم العثور على العميل');
      setCustomer(null);
    }
  };

  const handleMarkAsVisited = async () => {
    if (!customer || !employee) return;

    const result = await executeMarkVisited({
      customer_id: customer.id,
      employee_id: employee.id,
    });

    if (result?.data?.success) {
      toast.success('تم تسجيل حضور العميل بنجاح');
      setCustomer({ ...customer, has_visited: true });
      loadEmployeeData();
    } else {
      toast.error('فشل تسجيل حضور العميل');
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const result = await executeCreateDevice({
      customer_id: customer.id,
      ...deviceForm,
      estimated_cost: parseFloat(deviceForm.estimated_cost) || 0,
    });

    if (result?.data?.success) {
      toast.success('تم تسجيل الجهاز بنجاح');
      setDeviceForm({
        device_type: '',
        brand: '',
        model: '',
        serial_number: '',
        problem_description: '',
        estimated_cost: '',
      });
    } else {
      toast.error('فشل تسجيل الجهاز');
    }
  };

  if (isLoading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  if (!employee) {
    return <div className="p-8">لم يتم العثور على بيانات الموظف</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">لوحة موظف الريسبشن</h1>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الموظف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">الاسم</p>
              <p className="font-semibold">{employee.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">كود الموظف</p>
              <p className="font-semibold">{employee.employee_code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Total */}
      {dailyTotal && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>الراتب اليومي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {dailyTotal.daily_salary} جنيه
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>حوافز اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {dailyTotal.daily_incentives} جنيه
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الإجمالي اليومي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {dailyTotal.total} جنيه
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Incentives */}
      {todayIncentives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>حوافز اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayIncentives.map((incentive) => (
                <div
                  key={incentive.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-semibold">{incentive.description}</p>
                    <p className="text-sm text-gray-500">
                      {incentive.incentive_type}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    +{incentive.amount} جنيه
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Customer */}
      <Card>
        <CardHeader>
          <CardTitle>البحث عن عميل</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchCustomer} className="flex gap-4">
            <Input
              placeholder="أدخل كود العميل"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearchingCustomer}>
              {isSearchingCustomer ? 'جاري البحث...' : 'بحث'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Customer Details */}
      {customer && (
        <Card>
          <CardHeader>
            <CardTitle>بيانات العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">الاسم</p>
                <p className="font-semibold">{customer.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">رقم الهاتف</p>
                <p className="font-semibold">{customer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                <p className="font-semibold">{customer.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">حالة الحضور</p>
                <p
                  className={`font-semibold ${
                    customer.has_visited ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {customer.has_visited ? 'حضر' : 'لم يحضر'}
                </p>
              </div>
            </div>

            {!customer.has_visited && (
              <Button
                onClick={handleMarkAsVisited}
                disabled={isMarkingVisited}
                className="w-full"
              >
                {isMarkingVisited ? 'جاري التسجيل...' : 'تسجيل حضور العميل'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Device Registration Form */}
      {customer && customer.has_visited && (
        <Card>
          <CardHeader>
            <CardTitle>تسجيل جهاز</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="device_type">نوع الجهاز *</Label>
                  <Input
                    id="device_type"
                    value={deviceForm.device_type}
                    onChange={(e) =>
                      setDeviceForm({ ...deviceForm, device_type: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">الماركة</Label>
                  <Input
                    id="brand"
                    value={deviceForm.brand}
                    onChange={(e) =>
                      setDeviceForm({ ...deviceForm, brand: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="model">الموديل</Label>
                  <Input
                    id="model"
                    value={deviceForm.model}
                    onChange={(e) =>
                      setDeviceForm({ ...deviceForm, model: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="serial_number">الرقم التسلسلي</Label>
                  <Input
                    id="serial_number"
                    value={deviceForm.serial_number}
                    onChange={(e) =>
                      setDeviceForm({
                        ...deviceForm,
                        serial_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_cost">التكلفة المتوقعة</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    step="0.01"
                    value={deviceForm.estimated_cost}
                    onChange={(e) =>
                      setDeviceForm({
                        ...deviceForm,
                        estimated_cost: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="problem_description">وصف المشكلة *</Label>
                <Textarea
                  id="problem_description"
                  value={deviceForm.problem_description}
                  onChange={(e) =>
                    setDeviceForm({
                      ...deviceForm,
                      problem_description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <Button type="submit" disabled={isCreatingDevice}>
                {isCreatingDevice ? 'جاري التسجيل...' : 'تسجيل الجهاز'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
