'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLeaveBalance,
  getLeaveRequests,
  getLeaveStats,
} from '@/app/actions/employee-extended-actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  XCircle,
} from 'lucide-react';

export default function EmployeeLeavesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceResult, requestsResult, statsResult] = await Promise.all([
        getLeaveBalance(''),
        getLeaveRequests(''),
        getLeaveStats(''),
      ]);

      if (balanceResult.data) {
        setBalance(balanceResult.data);
      }

      if (requestsResult.data) {
        setRequests(requestsResult.data);
      }

      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'موافق عليها':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 ml-1" />
            موافق عليها
          </Badge>
        );
      case 'مرفوضة':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            مرفوضة
          </Badge>
        );
      case 'قيد المراجعة':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 ml-1" />
            قيد المراجعة
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الإجازات</h1>
          <p className="text-muted-foreground">
            عرض رصيد الإجازات وتقديم طلبات جديدة
          </p>
        </div>
        <Button onClick={() => router.push('/employee/leaves/request')}>
          <Plus className="w-4 h-4 ml-2" />
          تقديم طلب إجازة
        </Button>
      </div>

      {/* رصيد الإجازات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              الإجازات السنوية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.annual_leave_remaining || 0} يوم
            </div>
            <p className="text-xs text-muted-foreground">
              من أصل {balance?.annual_leave_total || 21} يوم
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              تم استخدام: {balance?.annual_leave_used || 0} يوم
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              الإجازات المرضية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.sick_leave_remaining || 0} يوم
            </div>
            <p className="text-xs text-muted-foreground">
              من أصل {balance?.sick_leave_total || 15} يوم
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              تم استخدام: {balance?.sick_leave_used || 0} يوم
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              الإجازات الطارئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.emergency_leave_remaining || 0} يوم
            </div>
            <p className="text-xs text-muted-foreground">
              من أصل {balance?.emergency_leave_total || 7} أيام
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              تم استخدام: {balance?.emergency_leave_used || 0} يوم
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                موافق عليها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved_requests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">
                مرفوضة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected_requests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600">
                قيد المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending_requests}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* طلبات الإجازات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            طلبات الإجازات
          </CardTitle>
          <CardDescription>
            عرض جميع طلبات الإجازات المقدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لم تقدم أي طلبات إجازة بعد</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/employee/leaves/request')}
              >
                تقديم طلب إجازة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع الإجازة</TableHead>
                  <TableHead>من تاريخ</TableHead>
                  <TableHead>إلى تاريخ</TableHead>
                  <TableHead>عدد الأيام</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.leave_type}
                    </TableCell>
                    <TableCell>{request.start_date}</TableCell>
                    <TableCell>{request.end_date}</TableCell>
                    <TableCell>{request.days_count} يوم</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString('ar-EG')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* أيام الغياب */}
      <Card>
        <CardHeader>
          <CardTitle>أيام الغياب</CardTitle>
          <CardDescription>
            عرض أيام الغياب بإذن وبدون إذن
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    أيام الغياب بإذن
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.total_days_taken || 0} يوم
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                الإجازات الموافق عليها
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    أيام الغياب بدون إذن
                  </p>
                  <p className="text-2xl font-bold text-red-600">0 يوم</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                سيتم حسابها من نظام الحضور والانصراف
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
