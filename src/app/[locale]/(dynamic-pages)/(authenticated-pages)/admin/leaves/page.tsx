'use client';

import { useEffect, useState } from 'react';
import {
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '@/app/actions/admin-actions';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  User,
  XCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminLeavesPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [statusFilter, requests]);

  const loadRequests = async () => {
    try {
      const result = await getAllLeaveRequests();
      if (result.data) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(
        requests.filter((req) => req.status === statusFilter)
      );
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const result = await approveLeaveRequest(selectedRequest.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('تم قبول طلب الإجازة بنجاح!');
        setShowApproveDialog(false);
        setSelectedRequest(null);
        loadRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('حدث خطأ أثناء الموافقة على الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }

    setProcessing(true);
    try {
      const result = await rejectLeaveRequest(
        selectedRequest.id,
        rejectionReason
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('تم رفض طلب الإجازة');
        setShowRejectDialog(false);
        setSelectedRequest(null);
        setRejectionReason('');
        loadRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('حدث خطأ أثناء رفض الطلب');
    } finally {
      setProcessing(false);
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

  const pendingCount = requests.filter(
    (r) => r.status === 'قيد المراجعة'
  ).length;
  const approvedCount = requests.filter(
    (r) => r.status === 'موافق عليها'
  ).length;
  const rejectedCount = requests.filter((r) => r.status === 'مرفوضة').length;

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">إدارة طلبات الإجازات</h1>
        <p className="text-muted-foreground">
          مراجعة والموافقة على طلبات الإجازات
        </p>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              إجمالي الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
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
              {pendingCount}
            </div>
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
              {approvedCount}
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
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الطلبات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                طلبات الإجازات
              </CardTitle>
              <CardDescription>
                عرض جميع طلبات الإجازات المقدمة من الموظفين
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                <SelectItem value="موافق عليها">موافق عليها</SelectItem>
                <SelectItem value="مرفوضة">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>نوع الإجازة</TableHead>
                  <TableHead>من - إلى</TableHead>
                  <TableHead>الأيام</TableHead>
                  <TableHead>الموظف البديل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium">
                            {request.employee_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.employee_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{request.leave_type}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{request.start_date}</div>
                        <div>{request.end_date}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.days_count} يوم</TableCell>
                    <TableCell>
                      {request.substitute_employee_name || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === 'قيد المراجعة' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveDialog(true);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 ml-1" />
                            قبول
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <FileText className="w-4 h-4 ml-1" />
                          عرض
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

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الموافقة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من الموافقة على طلب الإجازة؟
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">الموظف:</span>{' '}
                  {selectedRequest.employee_name}
                </div>
                <div>
                  <span className="font-medium">نوع الإجازة:</span>{' '}
                  {selectedRequest.leave_type}
                </div>
                <div>
                  <span className="font-medium">من تاريخ:</span>{' '}
                  {selectedRequest.start_date}
                </div>
                <div>
                  <span className="font-medium">إلى تاريخ:</span>{' '}
                  {selectedRequest.end_date}
                </div>
                <div>
                  <span className="font-medium">عدد الأيام:</span>{' '}
                  {selectedRequest.days_count} يوم
                </div>
                <div>
                  <span className="font-medium">الموظف البديل:</span>{' '}
                  {selectedRequest.substitute_employee_name}
                </div>
              </div>
              <div>
                <span className="font-medium">السبب:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRequest.reason}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الموافقة...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  تأكيد الموافقة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>
              يرجى كتابة سبب رفض طلب الإجازة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">سبب الرفض *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="اكتب سبب رفض الطلب..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الرفض...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 ml-2" />
                  تأكيد الرفض
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
