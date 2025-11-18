'use client';

import { useEffect, useState } from 'react';
import {
  getEmployeeByUserId,
  getEmployeeDailyTotal,
} from '@/app/actions/employee-actions';
import {
  markCustomerAsVisited,
  getCustomerByCode,
} from '@/app/actions/customer-actions';
import { getTodayIncentivesByEmployee } from '@/app/actions/incentive-actions';
import { createDevice } from '@/app/actions/device-actions';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingVisit, setIsMarkingVisit] = useState(false);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);

  // Form states
  const [customerCode, setCustomerCode] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  
  const [deviceForm, setDeviceForm] = useState({
    customer_id: '',
    device_type: '',
    brand: '',
    model: '',
    serial_number: '',
    problem_description: '',
    accessories: '',
    estimated_cost: '',
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
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('فشل تحميل بيانات الموظف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchCustomer = async () => {
    if (!customerCode.trim()) {
      toast.error('الرجاء إدخال كود العميل');
      return;
    }

    try {
      const result = await getCustomerByCode({ customer_code: customerCode });
      
      if (result?.data) {
        const customer = result.data as any;
        setCurrentCustomer(customer);
        setDeviceForm({ ...deviceForm, customer_id: customer.id });
        toast.success('تم العثور على العميل');
      } else {
        toast.error('لم يتم العثور على العميل');
        setCurrentCustomer(null);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      toast.error('حدث خطأ أثناء البحث عن العميل');
    }
  };

  const handleMarkVisit = async () => {
    if (!currentCustomer) {
      toast.error('الرجاء البحث عن العميل أولاً');
      return;
    }

    try {
      setIsMarkingVisit(true);
      const result = await markCustomerAsVisited({ customer_id: currentCustomer.id });
      
      if (result?.data) {
        toast.success('تم تسجيل حضور العميل بنجاح');
        setCurrentCustomer({ ...currentCustomer, has_visited: true });
        loadEmployeeData(); // Reload to get updated incentives
      } else {
        toast.error('فشل تسجيل حضور العميل');
      }
    } catch (error) {
      console.error('Error marking visit:', error);
      toast.error('حدث خطأ أثناء تسجيل حضور العميل');
    } finally {
      setIsMarkingVisit(false);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !currentCustomer) return;

    try {
      setIsCreatingDevice(true);
      const result = await createDevice({
        ...deviceForm,
        customer_id: currentCustomer.id,
        received_by: employee.id,
        estimated_cost: parseFloat(deviceForm.estimated_cost) || 0,
      });

      if (result?.data) {
        toast.success('تم تسجيل الجهاز بنجاح');
        setDeviceForm({
          customer_id: currentCustomer.id,
          device_type: '',
          brand: '',
          model: '',
          serial_number: '',
          problem_description: '',
          accessories: '',
          estimated_cost: '',
        });
      } else {
        toast.error('فشل تسجيل الجهاز');
      }
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error('حدث خطأ أثناء تسجيل الجهاز');
    } finally {
      setIsCreatingDevice(false);
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
      <h1 className="text-3xl font-bold">لوحة موظف الريسبشن</h1>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الموظف</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            <strong>الاسم:</strong> {employee.full_name}
          </p>
          <p className="text-lg">
            <strong>كود الموظف:</strong> {employee.employee_code}
          </p>
        </CardContent>
      </Card>

      {/* Daily Total & Incentives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="flex justify-between items-center p-2 bg-gray-100 rounded"
                  >
                    <span className="text-sm">{incentive.incentive_type}</span>
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
      </div>

      {/* Search Customer */}
      <Card>
        <CardHeader>
          <CardTitle>البحث عن عميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="أدخل كود العميل"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomer()}
            />
            <Button onClick={handleSearchCustomer}>بحث</Button>
          </div>

          {currentCustomer && (
            <div className="p-4 bg-gray-100 rounded space-y-2">
              <p>
                <strong>الاسم:</strong> {currentCustomer.full_name}
              </p>
              <p>
                <strong>الهاتف:</strong> {currentCustomer.phone}
              </p>
              <p>
                <strong>كود العميل:</strong> {currentCustomer.customer_code}
              </p>
              <p>
                <strong>الحالة:</strong>{' '}
                {currentCustomer.has_visited ? (
                  <span className="text-green-600">حضر</span>
                ) : (
                  <span className="text-red-600">لم يحضر</span>
                )}
              </p>
              {!currentCustomer.has_visited && (
                <Button onClick={handleMarkVisit} disabled={isMarkingVisit}>
                  {isMarkingVisit ? 'جاري التسجيل...' : 'تسجيل حضور العميل'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Device */}
      {currentCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>تسجيل جهاز</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDevice} className="space-y-4">
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
                <Label htmlFor="brand">الماركة *</Label>
                <Input
                  id="brand"
                  value={deviceForm.brand}
                  onChange={(e) =>
                    setDeviceForm({ ...deviceForm, brand: e.target.value })
                  }
                  required
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
                    setDeviceForm({ ...deviceForm, serial_number: e.target.value })
                  }
                />
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
                <Label htmlFor="accessories">الملحقات</Label>
                <Textarea
                  id="accessories"
                  value={deviceForm.accessories}
                  onChange={(e) =>
                    setDeviceForm({ ...deviceForm, accessories: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="estimated_cost">التكلفة المتوقعة (جنيه)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={deviceForm.estimated_cost}
                  onChange={(e) =>
                    setDeviceForm({ ...deviceForm, estimated_cost: e.target.value })
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
