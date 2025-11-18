// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { getAllEmployees } from '@/app/actions/admin-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalIncentivesToday: 0,
    totalSalariesToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const employees = await getAllEmployees();
      
      if (employees) {
        const activeCount = employees.filter((emp: any) => emp.is_active).length;
        
        setStats({
          totalEmployees: employees.length,
          activeEmployees: activeCount,
          totalIncentivesToday: 0, // سيتم حسابها من قاعدة البيانات
          totalSalariesToday: 0 // سيتم حسابها من قاعدة البيانات
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8" dir="rtl">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">لوحة تحكم الأدمن</h1>
        <p className="text-muted-foreground mt-2">
          نظرة عامة على إحصائيات النظام
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الموظفين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              موظف مسجل في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الموظفون النشطون
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              موظف نشط حالياً
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الحوافز اليوم
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncentivesToday} جنيه</div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي الحوافز المدفوعة اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الرواتب اليوم
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSalariesToday} جنيه</div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي الرواتب اليومية
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>آخر الموظفين المضافين</CardTitle>
            <CardDescription>
              آخر 5 موظفين تم إضافتهم إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              لا توجد بيانات متاحة حالياً
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أعلى الحوافز اليوم</CardTitle>
            <CardDescription>
              الموظفون الحاصلون على أعلى حوافز اليوم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              لا توجد بيانات متاحة حالياً
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
