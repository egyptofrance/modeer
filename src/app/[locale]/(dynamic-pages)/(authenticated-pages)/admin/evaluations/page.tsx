'use client';

import { useEffect, useState } from 'react';
import {
  getAllEmployees,
  createEvaluation,
  getAllEvaluations,
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
import { toast } from 'sonner';
import { Plus, Star, TrendingUp } from 'lucide-react';

export default function EvaluationsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    evaluation_month: new Date().getMonth() + 1,
    evaluation_year: new Date().getFullYear(),
    performance_score: 3,
    commitment_score: 3,
    customer_service_score: 3,
    teamwork_score: 3,
    innovation_score: 3,
    evaluator_notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empResult, evalResult] = await Promise.all([
        getAllEmployees(),
        getAllEvaluations(),
      ]);

      if (empResult?.data) {
        setEmployees(empResult.data);
      }
      if (evalResult?.data) {
        setEvaluations(evalResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      toast.error('يرجى اختيار موظف');
      return;
    }

    try {
      setProcessing(true);
      // TODO: Get current admin user ID and name
      const result = await createEvaluation({
        ...formData,
        evaluated_by: 'admin-id',
        evaluated_by_name: 'المدير',
      });

      if (result?.data) {
        toast.success('تم إضافة التقييم بنجاح');
        setShowCreateDialog(false);
        resetForm();
        loadData();
      } else {
        toast.error('فشل في إضافة التقييم');
      }
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      evaluation_month: new Date().getMonth() + 1,
      evaluation_year: new Date().getFullYear(),
      performance_score: 3,
      commitment_score: 3,
      customer_service_score: 3,
      teamwork_score: 3,
      innovation_score: 3,
      evaluator_notes: '',
    });
  };

  const ScoreInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`p-2 rounded transition-colors ${
              value >= score
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Star className="w-5 h-5" fill={value >= score ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className="text-sm font-medium">{value}/5</span>
      </div>
    </div>
  );

  const GradeBadge = ({ grade }: { grade: string }) => {
    const variants: Record<string, string> = {
      ممتاز: 'default',
      'جيد جداً': 'secondary',
      جيد: 'outline',
      مقبول: 'outline',
      ضعيف: 'destructive',
    };

    return <Badge variant={variants[grade] as any}>{grade}</Badge>;
  };

  const EvaluationCard = ({ evaluation }: any) => {
    const average = evaluation.average_score || 0;
    const grade = evaluation.grade || 'غير محدد';

    return (
      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">
                {evaluation.employees?.full_name}
              </span>
              <GradeBadge grade={grade} />
            </div>
            <p className="text-sm text-muted-foreground">
              {evaluation.employees?.employee_types?.name} - كود:{' '}
              {evaluation.employees?.employee_code}
            </p>
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold">{average.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">المتوسط</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between text-sm">
            <span>الأداء</span>
            <span className="font-medium">{evaluation.performance_score}/5</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>الالتزام</span>
            <span className="font-medium">{evaluation.commitment_score}/5</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>خدمة العملاء</span>
            <span className="font-medium">
              {evaluation.customer_service_score}/5
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>العمل الجماعي</span>
            <span className="font-medium">{evaluation.teamwork_score}/5</span>
          </div>
          <div className="flex items-center justify-between text-sm col-span-2">
            <span>الابتكار</span>
            <span className="font-medium">{evaluation.innovation_score}/5</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {evaluation.evaluation_month}/{evaluation.evaluation_year} - بواسطة:{' '}
          {evaluation.evaluated_by_name}
        </div>

        {evaluation.evaluator_notes && (
          <div className="text-sm bg-white p-2 rounded">
            <Label className="text-xs">ملاحظات المقيّم</Label>
            <p className="mt-1">{evaluation.evaluator_notes}</p>
          </div>
        )}
      </div>
    );
  };

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
          <h1 className="text-3xl font-bold">إدارة التقييمات</h1>
          <p className="text-muted-foreground mt-1">
            إجمالي التقييمات: {evaluations.length}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة تقييم جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التقييمات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length > 0 ? (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تقييمات
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة تقييم شهري</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="employee">الموظف *</Label>
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

              <div>
                <Label htmlFor="month">الشهر</Label>
                <Select
                  value={formData.evaluation_month.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      evaluation_month: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">السنة</Label>
                <Input
                  type="number"
                  value={formData.evaluation_year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evaluation_year: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">معايير التقييم</h3>

              <ScoreInput
                label="الأداء الوظيفي"
                value={formData.performance_score}
                onChange={(value) =>
                  setFormData({ ...formData, performance_score: value })
                }
              />

              <ScoreInput
                label="الالتزام والانضباط"
                value={formData.commitment_score}
                onChange={(value) =>
                  setFormData({ ...formData, commitment_score: value })
                }
              />

              <ScoreInput
                label="خدمة العملاء"
                value={formData.customer_service_score}
                onChange={(value) =>
                  setFormData({ ...formData, customer_service_score: value })
                }
              />

              <ScoreInput
                label="العمل الجماعي"
                value={formData.teamwork_score}
                onChange={(value) =>
                  setFormData({ ...formData, teamwork_score: value })
                }
              />

              <ScoreInput
                label="الابتكار والتطوير"
                value={formData.innovation_score}
                onChange={(value) =>
                  setFormData({ ...formData, innovation_score: value })
                }
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات المقيّم</Label>
              <Textarea
                id="notes"
                value={formData.evaluator_notes}
                onChange={(e) =>
                  setFormData({ ...formData, evaluator_notes: e.target.value })
                }
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
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
                {processing ? 'جاري الإضافة...' : 'إضافة التقييم'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
