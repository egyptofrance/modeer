'use client';

import { useEffect, useState } from 'react';
import { getEmployeeByUserId } from '@/app/actions/employee-actions';
import {
  getEmployeeExtendedData,
  getEmployeeDailySalary,
  getTotalFixedIncentives,
} from '@/app/actions/employee-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [dailySalary, setDailySalary] = useState<number>(0);
  const [monthlyIncentives, setMonthlyIncentives] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const empResult = await getEmployeeByUserId();

      if (empResult?.data) {
        const emp = empResult.data as any;
        
        // Load extended data
        const extendedResult = await getEmployeeExtendedData(emp.id);
        if (extendedResult?.data) {
          setEmployee(extendedResult.data);
        }

        // Load daily salary
        const salaryResult = await getEmployeeDailySalary(emp.id);
        if (salaryResult?.data) {
          setDailySalary(salaryResult.data);
        }

        // Load incentives
        const incentivesResult = await getTotalFixedIncentives(emp.id);
        if (incentivesResult?.data) {
          setMonthlyIncentives(incentivesResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
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

  const dailyIncentives = monthlyIncentives / 30;
  const dailyTotal = dailySalary + dailyIncentives;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">بياناتي</h1>

      {/* Salary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الراتب اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailySalary.toFixed(2)} جنيه</div>
            <p className="text-xs text-muted-foreground mt-1">
              ({employee.base_salary?.toFixed(2)} جنيه شهرياً)
            </p>
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

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات الشخصية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الاسم الكامل</p>
              <p className="text-lg font-medium">{employee.full_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">كود الموظف</p>
              <p className="text-lg font-medium">
                <Badge variant="outline">{employee.employee_code}</Badge>
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="text-lg font-medium">{employee.email || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
              <p className="text-lg font-medium">{employee.phone || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">تاريخ الميلاد</p>
              <p className="text-lg font-medium">
                {employee.date_of_birth
                  ? new Date(employee.date_of_birth).toLocaleDateString('ar-EG')
                  : '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">الجنس</p>
              <p className="text-lg font-medium">{employee.gender || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">تاريخ التعيين</p>
              <p className="text-lg font-medium">
                {employee.hire_date
                  ? new Date(employee.hire_date).toLocaleDateString('ar-EG')
                  : '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">مدة العمل</p>
              <p className="text-lg font-medium">
                {employee.hire_date
                  ? calculateWorkDuration(employee.hire_date)
                  : '-'}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground">العنوان</p>
            <p className="text-lg font-medium">{employee.address || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle>المؤهلات الدراسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">المؤهل</p>
              <p className="text-lg font-medium">
                {employee.qualification_level || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">اسم المؤهل</p>
              <p className="text-lg font-medium">
                {employee.qualification_name || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">سكور اختبار التقدم</p>
              <p className="text-lg font-medium">
                {employee.initial_test_score !== null ? (
                  <>
                    <Badge
                      variant={
                        employee.initial_test_score >= 70
                          ? 'default'
                          : employee.initial_test_score >= 50
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {employee.initial_test_score}%
                    </Badge>
                  </>
                ) : (
                  '-'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateWorkDuration(hireDate: string): string {
  const start = new Date(hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;

  const parts = [];
  if (years > 0) parts.push(`${years} سنة`);
  if (months > 0) parts.push(`${months} شهر`);
  if (days > 0) parts.push(`${days} يوم`);

  return parts.join(' و ') || '0 يوم';
}
