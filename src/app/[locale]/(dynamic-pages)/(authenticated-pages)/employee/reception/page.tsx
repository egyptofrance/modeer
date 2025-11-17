'use client';

import { useEffect, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import {
  getEmployeeByUserId,
  getEmployeeDailyTotal,
} from '@/app/actions/employee-actions';
import {
  registerCustomerVisit,
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
  const [customerCode, setCustomerCode] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);

  // Device form state
  const [deviceForm, setDeviceForm] = useState({
    device_type: '',
    brand: '',
    model: '',
    serial_number: '',
    problem_description: '',
    estimated_cost: '',
    notes: '',
  });

  // Actions
  const { execute: executeGetEmployee } = useAction(getEmployeeByUserId);
  const { execute: executeGetDailyTotal } = useAction(getEmployeeDailyTotal);
  const { execute: executeGetTodayIncentives } = useAction(
    getTodayIncentivesByEmployee
  );
  const { execute: executeGetCustomer, isExecuting: isSearching } =
    useAction(getCustomerByCode);
  const { execute: executeRegisterVisit, isExecuting: isRegistering } =
    useAction(registerCustomerVisit);
  const { execute: executeCreateDevice, isExecuting: isCreatingDevice } =
    useAction(createDevice);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    const result = await executeGetEmployee({});
    if (result?.data?.success) {
      const emp = result.data.data;
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
  };

  const handleSearchCustomer = async () => {
    if (!customerCode.trim()) {
      toast.error('الرجاء إدخال كود العميل');
      return;
    }

    const result = await executeGetCustomer({ customer_code: customerCode });
    if (result?.data?.success) {
      setCurrentCustomer(result.data.data);
      toast.success('تم العثور على العميل');
    } else {
      toast.error('لم يتم العثور على العميل');
      setCurrentCustomer(null);
    }
  };

  const handleRegisterVisit = async () => {
    if (!employee || !currentCustomer) return;

    const result = await executeRegisterVisit({
      customer_code: currentCustomer.customer_code,
      registered_by_employee_id: employee.id,
    });

    if (result?.data?.success) {
      toast.success('تم تسجيل حضور العميل بنجاح');
      setCurrentCustomer(result.data.data);
      loadEmployeeData();
    } else {
      toast.error('فشل تسجيل حضور العميل');
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) {
      toast.error('الرجاء تحديد العميل أولاً');
      return;
    }

    const result = await executeCreateDevice({
      customer_id: currentCustomer.id,
      device_type: deviceForm.device_type,
      brand: deviceForm.brand,
      model: deviceForm.model,
      serial_number: deviceForm.serial_number,
      problem_description: deviceForm.problem_description,
      estimated_cost: deviceForm.estimated_cost
        ? parseFloat(deviceForm.estimated_cost)
        : undefined,
      notes: deviceForm.notes,
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
        notes: '',
      });
    } else {
      toast.error('فشل تسجيل الجهاز');
    }
  };

  if (!employee) {
    return <div className="p-8">جاري التحميل...</div>;
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
          <CardTitle>البحث عن العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="customer_code">كود العميل</Label>
              <Input
                id="customer_code"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="مثال: 101-0001"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchCustomer();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchCustomer} disabled={isSearching}>
                {isSearching ? 'جاري البحث...' : 'بحث'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      {currentCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="font-semibold">{currentCustomer.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="font-semibold">{currentCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">كود العميل</p>
                  <p className="font-mono">{currentCustomer.customer_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <p
                    className={`font-semibold ${
                      currentCustomer.has_visited
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }`}
                  >
                    {currentCustomer.has_visited ? 'تم التسجيل' : 'لم يتم التسجيل'}
                  </p>
                </div>
              </div>

              {!currentCustomer.has_visited && (
                <Button onClick={handleRegisterVisit} disabled={isRegistering}>
                  {isRegistering ? 'جاري التسجيل...' : 'تسجيل حضور العميل'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Register Device */}
      {currentCustomer && currentCustomer.has_visited && (
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

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={deviceForm.notes}
                  onChange={(e) =>
                    setDeviceForm({ ...deviceForm, notes: e.target.value })
                  }
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
