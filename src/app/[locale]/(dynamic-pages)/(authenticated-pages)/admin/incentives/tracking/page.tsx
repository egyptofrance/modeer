'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

export default function IncentivesTrackingPage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/incentives/tracking');
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePayIncentive = async (employeeId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/incentives/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('تم دفع الحوافز بنجاح');
        loadData();
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">متابعة حوافز الكول سنتر</h1>
        <p className="text-muted-foreground">
          متابعة ودفع حوافز موظفي الكول سنتر بناءً على العملاء الذين جاءوا
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                إجمالي الموظفين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_employees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                إجمالي العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.total_customers}
              </div>
              <p className="text-xs text-muted-foreground">
                تم التفعيل: {summary.redeemed_customers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
                <DollarSign className="w-4 h-4" />
                الحوافز المستحقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.total_unpaid} جنيه
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-4 h-4" />
                تم الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {summary.total_paid} جنيه
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الحوافز لكل موظف</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد حوافز حالياً</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>إجمالي العملاء</TableHead>
                  <TableHead>تم التفعيل</TableHead>
                  <TableHead>معدل التحويل</TableHead>
                  <TableHead>الحوافز المستحقة</TableHead>
                  <TableHead>تم الدفع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell className="font-medium">{emp.employee_name}</TableCell>
                    <TableCell className="font-mono">{emp.employee_code}</TableCell>
                    <TableCell>{emp.total_leads}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{emp.redeemed_leads}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          emp.conversion_rate >= 50
                            ? 'default'
                            : emp.conversion_rate >= 30
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {emp.conversion_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600 font-semibold">
                        {emp.unpaid_incentives} جنيه
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {emp.paid_incentives} جنيه
                      </span>
                    </TableCell>
                    <TableCell>
                      {emp.unpaid_incentives > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handlePayIncentive(emp.employee_id)}
                          disabled={loading}
                        >
                          دفع الحوافز
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
