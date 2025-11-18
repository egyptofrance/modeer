'use client';

import { useEffect, useState } from 'react';
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
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Form state
  const [customerForm, setCustomerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Load employee data
  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      const empResult = await getEmployeeByUserId();
      
      if (empResult?.data) {
        const emp = empResult.data as any;
        setEmployee(emp);

        // Load statistics
        const statsResult = await getEmployeeStatistics({ employee_id: emp.id });
        if (statsResult?.data) {
          setStatistics(statsResult.data);
        }

        // Load daily total
        const dailyResult = await getEmployeeDailyTotal({ employee_id: emp.id });
        if (dailyResult?.data) {
          setDailyTotal(dailyResult.data);
        }

        // Load today's incentives
        const incentivesResult = await getTodayIncentivesByEmployee({
          employee_id: emp.id,
        });
        if (incentivesResult?.data) {
          setTodayIncentives(incentivesResult.data || []);
        }

        // Load customers
        const customersResult = await getCustomersByEmployee({
          employee_id: emp.id,
        });
        if (customersResult?.data) {
          setCustomers(customersResult.data || []);
        }

        // Check if already checked in today
        // This would need to be implemented in employee-actions
        setIsCheckedIn(false);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('فشل تحميل بيانات الموظف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) return;
    
    try {
      setIsCheckingIn(true);
      const result = await checkInEmployee({ employee_id: employee.id });
      
      if (result?.data) {
        setIsCheckedIn(true);
        toast.success('تم تسجيل الحضور بنجاح');
        loadEmployeeData(); // Reload to get updated incentives
      } else {
        toast.error('فشل تسجيل الحضور');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('حدث خطأ أثناء تسجيل الحضور');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employee) return;
    
    try {
      setIsCheckingOut(true);
      const result = await checkOutEmployee({ employee_id: employee.id });
      
      if (result?.data) {
        setIsCheckedIn(false);
        toast.success('تم تسجيل الانصراف بنجاح');
        loadEmployeeData(); // Reload to get updated incentives
      } else {
        toast.error('فشل تسجيل الانصراف');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('حدث خطأ أثناء تسجيل الانصراف');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    try {
      setIsCreatingCustomer(true);
      const result = await createCustomer({
        ...customerForm,
        assigned_by_employee_id: employee.id,
      });

      if (result?.data) {
        toast.success(`تم تسجيل العميل بنجاح. كود العميل: ${result.data.customer_code}`);
        setCustomerForm({
          full_name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        });
        loadEmployeeData(); // Reload to get updated customers and incentives
      } else {
        toast.error('فشل تسجيل العميل');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('حدث خطأ أثناء تسجيل العميل');
    } finally {
      setIsCreatingCustomer(false);
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
      <h1 className="text-3xl font-bold">لوحة موظف الكول سنتر</h1>

      {/* Employee Info & Check In/Out */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الموظف</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg">
              <strong>الاسم:</strong> {employee.full_name}
            </p>
            <p className="text-lg">
              <strong>كود الموظف:</strong> {employee.employee_code}
            </p>
          </div>
          <div className="flex gap-4">
            {!isCheckedIn ? (
              <Button onClick={handleCheckIn} disabled={isCheckingIn}>
                {isCheckingIn ? 'جاري التسجيل...' : 'تسجيل حضور'}
              </Button>
            ) : (
              <Button onClick={handleCheckOut} disabled={isCheckingOut} variant="destructive">
                {isCheckingOut ? 'جاري التسجيل...' : 'تسجيل انصراف'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{statistics?.total_customers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>العملاء الذين حضروا</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{statistics?.visited_customers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الراتب اليومي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {dailyTotal?.total || 0} جنيه
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Incentives */}
      <Card>
        <CardHeader>
          <CardTitle>حوافز اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          {todayIncentives.length > 0 ? (
            <div className="space-y-2">
              {todayIncentives.map((incentive: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-100 rounded"
                >
                  <span>{incentive.incentive_type}</span>
                  <span className="font-bold text-green-600">
                    +{incentive.amount} جنيه
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">لا توجد حوافز اليوم</p>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Form */}
      <Card>
        <CardHeader>
          <CardTitle>تسجيل عميل جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <Label htmlFor="full_name">الاسم الكامل *</Label>
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
                type="tel"
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
              <Textarea
                id="address"
                value={customerForm.address}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, address: e.target.value })
                }
              />
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

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>عملائي ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="space-y-2">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex justify-between items-center p-3 bg-gray-100 rounded"
                >
                  <div>
                    <p className="font-bold">{customer.full_name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    <p className="text-sm text-gray-600">
                      كود: {customer.customer_code}
                    </p>
                  </div>
                  <div>
                    {customer.has_visited ? (
                      <span className="text-green-600 font-bold">✓ حضر</span>
                    ) : (
                      <span className="text-gray-500">لم يحضر بعد</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">لا يوجد عملاء</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
