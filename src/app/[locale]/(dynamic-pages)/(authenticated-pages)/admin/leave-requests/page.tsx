'use client';

import { useEffect, useState } from 'react';
import {
  getPendingLeaveRequests,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '@/app/actions/admin-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

export default function LeaveRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [pendingResult, allResult] = await Promise.all([
        getPendingLeaveRequests(),
        getAllLeaveRequests(),
      ]);

      if (pendingResult?.data) {
        setPendingRequests(pendingResult.data);
      }
      if (allResult?.data) {
        setAllRequests(allResult.data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    if (!confirm(`هل أنت متأكد من الموافقة على طلب الإجازة؟`)) {
      return;
    }

    try {
      setProcessing(true);
      // TODO: Get current admin user ID and name
      const result = await approveLeaveRequest({
        requestId: request.id,
        reviewerId: 'admin-id', // Replace with actual admin ID
        reviewerName: 'المدير', // Replace with actual admin name
      });

      if (result?.data) {
        toast.success('تمت الموافقة على الطلب بنجاح');
        loadRequests();
      } else {
        toast.error('فشل في الموافقة على الطلب');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('حدث خطأ أثناء الموافقة');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      setProcessing(true);
      // TODO: Get current admin user ID and name
      const result = await rejectLeaveRequest({
        requestId: selectedRequest.id,
        reviewerId: 'admin-id',
        reviewerName: 'المدير',
        reason: rejectionReason,
      });

      if (result?.data) {
        toast.success('تم رفض الطلب');
        setShowRejectDialog(false);
        setSelectedRequest(null);
        setRejectionReason('');
        loadRequests();
      } else {
        toast.error('فشل في رفض الطلب');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('حدث خطأ أثناء الرفض');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, any> = {
      'قيد المراجعة': { variant: 'secondary', icon: Clock },
      'موافق عليها': { variant: 'default', icon: CheckCircle },
      مرفوضة: { variant: 'destructive', icon: XCircle },
      ملغاة: { variant: 'outline', icon: XCircle },
    };

    const config = variants[status] || variants['قيد المراجعة'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 ml-1" />
        {status}
      </Badge>
    );
  };

  const RequestCard = ({ request, showActions = false }: any) => (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">
              {request.employees?.full_name}
            </span>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {request.employees?.employee_types?.name} - كود:{' '}
            {request.employees?.employee_code}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">نوع الإجازة</Label>
          <p className="font-medium">{request.leave_type}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">عدد الأيام</Label>
          <p className="font-medium">{request.days_count} يوم</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">من</Label>
          <p className="font-medium">
            {new Date(request.start_date).toLocaleDateString('ar-EG')}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">إلى</Label>
          <p className="font-medium">
            {new Date(request.end_date).toLocaleDateString('ar-EG')}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">السبب</Label>
        <p className="text-sm mt-1">{request.reason}</p>
      </div>

      {request.notes && (
        <div>
          <Label className="text-xs text-muted-foreground">ملاحظات</Label>
          <p className="text-sm mt-1">{request.notes}</p>
        </div>
      )}

      {request.rejection_reason && (
        <div className="bg-red-50 p-3 rounded">
          <Label className="text-xs text-red-600">سبب الرفض</Label>
          <p className="text-sm text-red-700 mt-1">{request.rejection_reason}</p>
        </div>
      )}

      {request.reviewed_by_name && (
        <div className="text-xs text-muted-foreground">
          تمت المراجعة بواسطة: {request.reviewed_by_name} في{' '}
          {new Date(request.reviewed_at).toLocaleDateString('ar-EG')}
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleApprove(request)}
            disabled={processing}
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            موافقة
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => openRejectDialog(request)}
            disabled={processing}
          >
            <XCircle className="w-4 h-4 ml-1" />
            رفض
          </Button>
        </div>
      )}
    </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">موافقات الإجازات</h1>
          <p className="text-muted-foreground mt-1">
            طلبات معلقة: {pendingRequests.length}
          </p>
        </div>
        <Calendar className="w-8 h-8 text-muted-foreground" />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            قيد المراجعة ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            كل الطلبات ({allRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الإجازات المعلقة</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات معلقة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>كل طلبات الإجازات</CardTitle>
            </CardHeader>
            <CardContent>
              {allRequests.length > 0 ? (
                <div className="space-y-4">
                  {allRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض طلب الإجازة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">سبب الرفض *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب رفض الطلب..."
                rows={4}
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
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? 'جاري الرفض...' : 'رفض الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
