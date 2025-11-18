'use client';

import { useEffect, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import {
  getEmployeeByUserId,
  getEmployeeStatistics,
  getEmployeeDailyTotal,
  checkInEmployee,
  checkOutEmployee,
} from '@/app/actions/employee-actions';
import {
  createCustomer,
  getCustomersByEmployee,
} from '@/app/actions/customer-actions';
import { getTodayIncentivesByEmployee } from '@/app/actions/incentive-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function CallCenterDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [dailyTotal, setDailyTotal] = useState<any>(null);
  const [todayIncentives, setTodayIncentives] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [customerForm, setCustomerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Actions
  const { execute: executeGetStats } = useAction(getEmployeeStatistics);
  const { execute: executeGetDailyTotal } = useAction(getEmployeeDailyTotal);
  const { execute: executeGetTodayIncentives } = useAction(
    getTodayIncentivesByEmployee
  );
  const { execute: executeGetCustomers } = useAction(getCustomersByEmployee);
  const { execute: executeCheckIn, isExecuting: isCheckingIn } =
    useAction(checkInEmployee);
  const { execute: executeCheckOut, isExecuting: isCheckingOut } =
    useAction(checkOutEmployee);
  const { execute: executeCreateCustomer, isExecuting: isCreatingCustomer } =
    useAction(createCustomer);

  // Load employee data
  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      // استدعاء getEmployeeByUserId مباشرة
      const empResult = await getEmployeeByUserId();
      
      if (empResult?.data) {
        const emp = empResult.data as any;
        setEmployee(emp);

        // Load statistics
        const statsResult = await executeGetStats({ employee_id: emp.id });
        if (statsResult?.data?.success) {
          setStatistics(statsResult.data.data);
        }

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

        // Load customers
        const customersResult = await executeGetCustomers({ employee_id: emp.id });
        if (customersResult?.data?.success) {
          setCustomers(customersResult.data.data);
        }
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) return;

    const result = await executeCheckIn({ employee_id: employee.id });
    if (result?.data?.success) {
      toast.success('تم تسجيل الحضور بنجاح');
      setIsCheckedIn(true);
      loadEmployeeData();
    } else {
      toast.error('فشل تسجيل الحضور');
    }
  };

  const handleCheckOut = async () => {
    if (!employee) return;

    const result = await executeCheckOut({ employee_id: employee.id });
    if (result?.data?.success) {
      toast.success('تم تسجيل الانصراف بنجاح');
      setIsCheckedIn(false);
      loadEmployeeData();
    } else {
      toast.error('فشل تسجيل الانصراف');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const result = await executeCreateCustomer({
      ...customerForm,
      assigned_by_employee_id: employee.id,
    });

    if (result?.data?.success) {
      toast.success(
        `تم تسجيل العميل بنجاح. الكود: ${result.data.data.customer_code}`
      );
      setCustomerForm({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
      loadEmployeeData();
    } else {
      toast.error('فشل تسجيل العميل');
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة موظف الكول سنتر</h1>
        <div className="flex gap-2">
          {!isCheckedIn ? (
            <Button onClick={handleCheckIn} disabled={isCheckingIn}>
              تسجيل الحضور
            </Button>
          ) : (
            <Button onClick={handleCheckOut} disabled={isCheckingOut}>
              تسجيل الانصراف
            </Button>
          )}
        </div>
      </div>

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

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statistics.total_customers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>العملاء الذين حضروا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {statistics.visited_customers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نسبة الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {statistics.visit_percentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الحوافز غير المدفوعة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {statistics.unpaid_incentives} جنيه
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

      {/* Create Customer Form */}
      <Card>
        <CardHeader>
          <CardTitle>تسجيل عميل جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">اسم العميل *</Label>
                <Input
                  id="full_name"
                  value={customerForm.full_name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={customerForm.notes}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, notes: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isCreatingCustomer}>
              {isCreatingCustomer ? 'جاري التسجيل...' : 'تسجيل العميل'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <CardTitle>العملاء المسجلين ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {customers.slice(0, 10).map((customer) => (
              <div
                key={customer.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-semibold">{customer.full_name}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
                <div className="text-left">
                  <p className="font-mono text-sm">{customer.customer_code}</p>
                  <p
                    className={`text-sm ${
                      customer.has_visited ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {customer.has_visited ? '✓ حضر' : 'لم يحضر'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
