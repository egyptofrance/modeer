'use client';

import { useEffect, useState } from 'react';
import { getEmployeeByUserId } from '@/app/actions/employee-actions';
import {
  getEmployeeEvaluations,
  getLatestEvaluation,
  getAverageEvaluation,
} from '@/app/actions/employee-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, Award } from 'lucide-react';

const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const CRITERIA = [
  { key: 'performance', label: 'الأداء' },
  { key: 'commitment', label: 'الالتزام' },
  { key: 'customer_service', label: 'خدمة العملاء' },
  { key: 'teamwork', label: 'العمل الجماعي' },
  { key: 'innovation', label: 'الابتكار' },
];

export default function EmployeeEvaluationsPage() {
  const [employee, setEmployee] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [latest, setLatest] = useState<any>(null);
  const [average, setAverage] = useState<number>(0);
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
        setEmployee(emp);

        // Load evaluations
        const evalsResult = await getEmployeeEvaluations(emp.id);
        if (evalsResult?.data) {
          setEvaluations(evalsResult.data);
        }

        // Load latest
        const latestResult = await getLatestEvaluation(emp.id);
        if (latestResult?.data && latestResult.data.length > 0) {
          setLatest(latestResult.data[0]);
        }

        // Load average
        const avgResult = await getAverageEvaluation(emp.id);
        if (avgResult?.data !== null) {
          setAverage(avgResult.data);
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

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">تقييماتي</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المتوسط العام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <div className="text-2xl font-bold">
                {average.toFixed(2)} / 5.00
              </div>
            </div>
            <Progress value={(average / 5) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              عدد التقييمات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <div className="text-2xl font-bold">{evaluations.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">تقييم معتمد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              آخر تقييم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-green-500" />
              <GradeBadge grade={latest?.grade || '-'} />
            </div>
            {latest && (
              <p className="text-xs text-muted-foreground mt-2">
                {MONTHS[latest.month - 1]} {latest.year}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Evaluation Details */}
      {latest && (
        <Card>
          <CardHeader>
            <CardTitle>آخر تقييم - {MONTHS[latest.month - 1]} {latest.year}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRITERIA.map((criterion) => {
                const score = latest[`${criterion.key}_score`] || 0;
                return (
                  <div key={criterion.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {criterion.label}
                      </span>
                      <span className="text-sm font-bold">
                        {score} / 5
                      </span>
                    </div>
                    <Progress value={(score / 5) * 100} />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">المتوسط</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {latest.average.toFixed(2)}
                  </span>
                  <GradeBadge grade={latest.grade} />
                </div>
              </div>
            </div>

            {latest.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">ملاحظات المدير:</p>
                <p className="text-sm text-muted-foreground">{latest.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evaluations History */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التقييمات ({evaluations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length > 0 ? (
            <div className="space-y-3">
              {evaluations.map((evaluation: any) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">
                        {MONTHS[evaluation.evaluation_month - 1]}{' '}
                        {evaluation.evaluation_year}
                      </span>
                      <GradeBadge grade={evaluation.grade} />
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {CRITERIA.map((criterion) => {
                        const score =
                          evaluation[`${criterion.key}_score`] || 0;
                        return (
                          <div
                            key={criterion.key}
                            className="text-center"
                          >
                            <p className="text-xs text-muted-foreground">
                              {criterion.label}
                            </p>
                            <p className="text-sm font-bold">{score}/5</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {evaluation.average_score.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">المتوسط</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Criteria Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>معايير التقييم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">الأداء</p>
            <p className="text-sm text-muted-foreground">
              جودة وكفاءة إنجاز المهام الموكلة
            </p>
          </div>
          <div>
            <p className="font-medium">الالتزام</p>
            <p className="text-sm text-muted-foreground">
              الالتزام بمواعيد العمل والسياسات
            </p>
          </div>
          <div>
            <p className="font-medium">خدمة العملاء</p>
            <p className="text-sm text-muted-foreground">
              التعامل مع العملاء بشكل احترافي
            </p>
          </div>
          <div>
            <p className="font-medium">العمل الجماعي</p>
            <p className="text-sm text-muted-foreground">
              التعاون مع الزملاء والفريق
            </p>
          </div>
          <div>
            <p className="font-medium">الابتكار</p>
            <p className="text-sm text-muted-foreground">
              المبادرة وتقديم أفكار جديدة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const variants: Record<string, string> = {
    ممتاز: 'default',
    'جيد جداً': 'secondary',
    جيد: 'outline',
    مقبول: 'outline',
    ضعيف: 'destructive',
  };

  return (
    <Badge variant={variants[grade] as any || 'outline'}>
      {grade}
    </Badge>
  );
}
