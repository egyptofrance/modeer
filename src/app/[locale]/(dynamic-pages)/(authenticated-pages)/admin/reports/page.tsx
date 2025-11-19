'use client';

import { useEffect, useState } from 'react';
import {
  getAllEmployees,
  getEmployeeReport,
  getSystemStats,
} from '@/app/actions/admin-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  Users,
  Calendar,
  Star,
  AlertTriangle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

export default function ReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeReport, setEmployeeReport] = useState<any>(null);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empResult, statsResult] = await Promise.all([
        getAllEmployees(),
        getSystemStats(),
      ]);

      if (empResult?.data) setEmployees(empResult.data);
      if (statsResult?.data) setSystemStats(statsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeReport = async (employeeId: string) => {
    if (!employeeId) return;

    try {
      setLoadingReport(true);
      const result = await getEmployeeReport({ employeeId });

      if (result?.data) {
        setEmployeeReport(result.data);
      } else {
        toast.error('فشل في تحميل التقرير');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('حدث خطأ');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    loadEmployeeReport(employeeId);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground mt-1">
          نظرة شاملة على أداء النظام والموظفين
        </p>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الموظفين"
            value={systemStats.total_employees || 0}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="طلبات الإجازات"
            value={systemStats.total_leave_requests || 0}
            icon={Calendar}
            color="bg-green-500"
          />
          <StatCard
            title="التقييمات"
            value={systemStats.total_evaluations || 0}
            icon={Star}
            color="bg-yellow-500"
          />
          <StatCard
            title="العقوبات"
            value={systemStats.total_penalties || 0}
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>
      )}

      {/* Employee Report */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير الموظف</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>اختر موظف</Label>
            <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظف لعرض تقريره" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.employee_types?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingReport && (
            <div className="text-center py-8">جاري تحميل التقرير...</div>
          )}

          {employeeReport && !loadingReport && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-lg mb-3">معلومات الموظف</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">الاسم</Label>
                    <p className="font-medium">
                      {employeeReport.employee?.full_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">الوظيفة</Label>
                    <p className="font-medium">
                      {employeeReport.employee?.employee_types?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      الراتب الأساسي
                    </Label>
                    <p className="font-medium">
                      {employeeReport.employee?.base_salary} جنيه
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      الراتب اليومي
                    </Label>
                    <p className="font-medium">
                      {employeeReport.employee?.daily_salary} جنيه
                    </p>
                  </div>
                </div>
              </div>

              {/* Training Stats */}
              {employeeReport.training && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold">التدريب والاختبارات</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        التوجيهات المكتملة
                      </Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {employeeReport.training.completed_orientations || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        الاختبارات الناجحة
                      </Label>
                      <p className="text-2xl font-bold text-green-600">
                        {employeeReport.training.passed_tests || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        متوسط الدرجات
                      </Label>
                      <p className="text-2xl font-bold text-yellow-600">
                        {employeeReport.training.average_score?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Evaluation Stats */}
              {employeeReport.evaluations && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-bold">التقييمات</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        إجمالي التقييمات
                      </Label>
                      <p className="text-2xl font-bold">
                        {employeeReport.evaluations.total_evaluations || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        المتوسط العام
                      </Label>
                      <p className="text-2xl font-bold text-yellow-600">
                        {employeeReport.evaluations.average_score?.toFixed(2) || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        تقييمات ممتازة
                      </Label>
                      <p className="text-2xl font-bold text-green-600">
                        {employeeReport.evaluations.excellent_count || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        آخر تقدير
                      </Label>
                      <Badge className="text-sm">
                        {employeeReport.evaluations.latest_grade || 'لا يوجد'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Stats */}
              {employeeReport.leave && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold">الإجازات</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        إجمالي الطلبات
                      </Label>
                      <p className="text-2xl font-bold">
                        {employeeReport.leave.total_requests || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        الموافق عليها
                      </Label>
                      <p className="text-2xl font-bold text-green-600">
                        {employeeReport.leave.approved_requests || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        المرفوضة
                      </Label>
                      <p className="text-2xl font-bold text-red-600">
                        {employeeReport.leave.rejected_requests || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        أيام الإجازة
                      </Label>
                      <p className="text-2xl font-bold">
                        {employeeReport.leave.total_days_taken || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Penalty Stats */}
              {employeeReport.penalties && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold">العقوبات</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        إجمالي العقوبات
                      </Label>
                      <p className="text-2xl font-bold">
                        {employeeReport.penalties.total_penalties || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        إجمالي الخصومات
                      </Label>
                      <p className="text-2xl font-bold text-red-600">
                        {employeeReport.penalties.total_deductions || 0} جنيه
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">التأخير</Label>
                      <p className="text-2xl font-bold">
                        {employeeReport.penalties.late_count || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الغياب</Label>
                      <p className="text-2xl font-bold">
                        {employeeReport.penalties.absence_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="flex justify-end">
                <Button onClick={() => window.print()}>
                  <FileText className="w-4 h-4 ml-2" />
                  طباعة التقرير
                </Button>
              </div>
            </div>
          )}

          {!employeeReport && !loadingReport && selectedEmployee && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات لهذا الموظف
            </div>
          )}

          {!selectedEmployee && (
            <div className="text-center py-8 text-muted-foreground">
              اختر موظفاً لعرض تقريره
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
