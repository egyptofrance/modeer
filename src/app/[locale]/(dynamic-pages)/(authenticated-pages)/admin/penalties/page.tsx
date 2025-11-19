'use client';

import { useEffect, useState } from 'react';
import {
  getAllEmployees,
  createPenalty,
  getAllPenalties,
  approvePenalty,
  cancelPenalty,
} from '@/app/actions/admin-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function PenaltiesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    penalty_type: 'تأخير',
    deduction_amount: 0,
    penalty_title: '',
    penalty_description: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '',
    notes: '',
    requires_approval: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empResult, penResult] = await Promise.all([
        getAllEmployees(),
        getAllPenalties(),
      ]);

      if (empResult?.data) setEmployees(empResult.data);
      if (penResult?.data) setPenalties(penResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.penalty_title) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      setProcessing(true);
      const result = await createPenalty({
        ...formData,
        applied_by: 'admin-id',
        applied_by_name: 'المدير',
      });

      if (result?.data) {
        toast.success('تم إضافة العقوبة بنجاح');
        setShowCreateDialog(false);
        resetForm();
        loadData();
      } else {
        toast.error('فشل في إضافة العقوبة');
      }
    } catch (error) {
      console.error('Error creating penalty:', error);
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (penaltyId: string) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذه العقوبة؟')) {
      return;
    }

    try {
      const result = await approvePenalty({
        penaltyId,
        approverId: 'admin-id',
      });

      if (result?.data) {
        toast.success('تمت الموافقة على العقوبة');
        loadData();
      } else {
        toast.error('فشل في الموافقة');
      }
    } catch (error) {
      console.error('Error approving penalty:', error);
      toast.error('حدث خطأ');
    }
  };

  const handleCancel = async (penaltyId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه العقوبة؟')) {
      return;
    }

    try {
      const result = await cancelPenalty({ penaltyId });

      if (result?.data) {
        toast.success('تم إلغاء العقوبة');
        loadData();
      } else {
        toast.error('فشل في الإلغاء');
      }
    } catch (error) {
      console.error('Error canceling penalty:', error);
      toast.error('حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      penalty_type: 'تأخير',
      deduction_amount: 0,
      penalty_title: '',
      penalty_description: '',
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: '',
      notes: '',
      requires_approval: false,
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, any> = {
      مطبقة: { variant: 'destructive', icon: AlertTriangle },
      معلقة: { variant: 'secondary', icon: AlertTriangle },
      ملغاة: { variant: 'outline', icon: XCircle },
    };

    const config = variants[status] || variants.معلقة;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 ml-1" />
        {status}
      </Badge>
    );
  };

  const PenaltyCard = ({ penalty }: any) => (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{penalty.employees?.full_name}</span>
            <StatusBadge status={penalty.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {penalty.employees?.employee_types?.name} - كود:{' '}
            {penalty.employees?.employee_code}
          </p>
        </div>
        <div className="text-left">
          <div className="text-xl font-bold text-red-600">
            -{penalty.deduction_amount} جنيه
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">{penalty.penalty_title}</h3>
        <Badge variant="outline" className="mt-1">
          {penalty.penalty_type}
        </Badge>
      </div>

      {penalty.penalty_description && (
        <p className="text-sm">{penalty.penalty_description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground">تاريخ الحادثة</Label>
          <p>{new Date(penalty.incident_date).toLocaleDateString('ar-EG')}</p>
        </div>
        {penalty.incident_time && (
          <div>
            <Label className="text-xs text-muted-foreground">الوقت</Label>
            <p>{penalty.incident_time}</p>
          </div>
        )}
      </div>

      {penalty.notes && (
        <div className="text-sm bg-white p-2 rounded">
          <Label className="text-xs">ملاحظات</Label>
          <p className="mt-1">{penalty.notes}</p>
        </div>
      )}

      {penalty.employee_response && (
        <div className="text-sm bg-blue-50 p-2 rounded">
          <Label className="text-xs text-blue-600">رد الموظف</Label>
          <p className="mt-1">{penalty.employee_response}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        تم التطبيق بواسطة: {penalty.applied_by_name} في{' '}
        {new Date(penalty.applied_date).toLocaleDateString('ar-EG')}
      </div>

      {penalty.status === 'معلقة' && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={() => handleApprove(penalty.id)}>
            <CheckCircle className="w-4 h-4 ml-1" />
            موافقة
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleCancel(penalty.id)}
          >
            <XCircle className="w-4 h-4 ml-1" />
            إلغاء
          </Button>
        </div>
      )}

      {penalty.status === 'مطبقة' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCancel(penalty.id)}
        >
          <XCircle className="w-4 h-4 ml-1" />
          إلغاء العقوبة
        </Button>
      )}
    </div>
  );

  const appliedPenalties = penalties.filter((p) => p.status === 'مطبقة');
  const pendingPenalties = penalties.filter((p) => p.status === 'معلقة');

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
          <h1 className="text-3xl font-bold">إدارة العقوبات</h1>
          <p className="text-muted-foreground mt-1">
            معلقة: {pendingPenalties.length} | مطبقة: {appliedPenalties.length}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة عقوبة
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">الكل ({penalties.length})</TabsTrigger>
          <TabsTrigger value="pending">معلقة ({pendingPenalties.length})</TabsTrigger>
          <TabsTrigger value="applied">مطبقة ({appliedPenalties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>كل العقوبات</CardTitle>
            </CardHeader>
            <CardContent>
              {penalties.length > 0 ? (
                <div className="space-y-4">
                  {penalties.map((penalty) => (
                    <PenaltyCard key={penalty.id} penalty={penalty} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عقوبات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>العقوبات المعلقة</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPenalties.length > 0 ? (
                <div className="space-y-4">
                  {pendingPenalties.map((penalty) => (
                    <PenaltyCard key={penalty.id} penalty={penalty} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عقوبات معلقة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applied">
          <Card>
            <CardHeader>
              <CardTitle>العقوبات المطبقة</CardTitle>
            </CardHeader>
            <CardContent>
              {appliedPenalties.length > 0 ? (
                <div className="space-y-4">
                  {appliedPenalties.map((penalty) => (
                    <PenaltyCard key={penalty.id} penalty={penalty} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عقوبات مطبقة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة عقوبة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>الموظف *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, employee_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر موظف" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع العقوبة *</Label>
                <Select
                  value={formData.penalty_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, penalty_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تأخير">تأخير</SelectItem>
                    <SelectItem value="غياب بدون إذن">غياب بدون إذن</SelectItem>
                    <SelectItem value="خطأ في العمل">خطأ في العمل</SelectItem>
                    <SelectItem value="إهمال">إهمال</SelectItem>
                    <SelectItem value="مخالفة سلوكية">مخالفة سلوكية</SelectItem>
                    <SelectItem value="عدم الالتزام بالزي">
                      عدم الالتزام بالزي
                    </SelectItem>
                    <SelectItem value="استخدام الهاتف">استخدام الهاتف</SelectItem>
                    <SelectItem value="تأخر في التسليم">تأخر في التسليم</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>مبلغ الخصم (جنيه) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.deduction_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deduction_amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>عنوان العقوبة *</Label>
              <Input
                value={formData.penalty_title}
                onChange={(e) =>
                  setFormData({ ...formData, penalty_title: e.target.value })
                }
                placeholder="مثال: تأخير 30 دقيقة"
              />
            </div>

            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formData.penalty_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    penalty_description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ الحادثة *</Label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) =>
                    setFormData({ ...formData, incident_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>وقت الحادثة</Label>
                <Input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) =>
                    setFormData({ ...formData, incident_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    requires_approval: checked as boolean,
                  })
                }
              />
              <Label htmlFor="approval" className="cursor-pointer">
                تتطلب موافقة الإدارة
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'جاري الإضافة...' : 'إضافة العقوبة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
