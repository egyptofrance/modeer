'use client';

import { useEffect, useState } from 'react';
import { getEmployeeByUserId } from '@/app/actions/employee-actions';
import {
  getEmployeeOrientations,
  getEmployeeTests,
  getAverageTestScore,
  submitTestAnswers,
} from '@/app/actions/employee-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  FileText,
} from 'lucide-react';

export default function EmployeeTrainingPage() {
  const [employee, setEmployee] = useState<any>(null);
  const [orientations, setOrientations] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Load orientations
        const orientsResult = await getEmployeeOrientations(emp.id);
        if (orientsResult?.data) {
          setOrientations(orientsResult.data);
        }

        // Load tests
        const testsResult = await getEmployeeTests(emp.id);
        if (testsResult?.data) {
          setTests(testsResult.data);
        }

        // Load average score
        const avgResult = await getAverageTestScore(emp.id);
        if (avgResult?.data !== null && avgResult?.data !== undefined) {
          setAverageScore(avgResult.data as number);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = (test: any) => {
    setActiveTest(test);
    setTestAnswers({});
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setTestAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmitTest = async () => {
    if (!employee || !activeTest) return;

    // Check all questions answered
    const questions = activeTest.questions || [];
    if (Object.keys(testAnswers).length < questions.length) {
      toast.error('يرجى الإجابة على جميع الأسئلة');
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate score
      let correctAnswers = 0;
      questions.forEach((q: any, index: number) => {
        if (testAnswers[index] === q.correct_answer) {
          correctAnswers++;
        }
      });

      const scorePercentage = (correctAnswers / questions.length) * 100;

      const result = await submitTestAnswers({
        employee_id: employee.id,
        test_title: activeTest.test_title,
        test_type: activeTest.test_type || 'اختبار تدريبي',
        score_obtained: correctAnswers,
        total_score: questions.length,
        test_date: new Date().toISOString().split('T')[0],
        answers: testAnswers,
      });

      if (result?.data) {
        toast.success(
          `تم إرسال الاختبار بنجاح! النتيجة: ${scorePercentage.toFixed(0)}%`
        );
        setActiveTest(null);
        setTestAnswers({});
        loadData(); // Reload
      } else {
        toast.error('فشل إرسال الاختبار');
      }
    } catch (error: any) {
      console.error('Error submitting test:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال الاختبار');
    } finally {
      setIsSubmitting(false);
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

  // If taking a test
  if (activeTest) {
    const questions = activeTest.questions || [];
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{activeTest.test_title}</h1>
          <Button
            variant="outline"
            onClick={() => setActiveTest(null)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الأسئلة ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question: any, index: number) => (
              <div key={index} className="space-y-3 pb-6 border-b last:border-0">
                <p className="font-medium">
                  {index + 1}. {question.question}
                </p>
                <RadioGroup
                  value={testAnswers[index]}
                  onValueChange={(value) => handleAnswerChange(index, value)}
                >
                  {question.options?.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem
                        value={option}
                        id={`q${index}-opt${optIndex}`}
                      />
                      <Label htmlFor={`q${index}-opt${optIndex}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <Button
              onClick={handleSubmitTest}
              disabled={isSubmitting || Object.keys(testAnswers).length < questions.length}
              className="w-full"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الإجابات'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">التدريب والاختبارات</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              التوجيهات المكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <div className="text-2xl font-bold">
                {orientations.filter((o) => o.status === 'مكتمل').length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              من أصل {orientations.length} توجيه
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الاختبارات المكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-500" />
              <div className="text-2xl font-bold">
                {tests.filter((t) => t.status === 'مكتمل').length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              من أصل {tests.length} اختبار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط الدرجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <div className="text-2xl font-bold">
                {averageScore.toFixed(1)}%
              </div>
            </div>
            <Progress value={averageScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Orientations */}
      <Card>
        <CardHeader>
          <CardTitle>التوجيهات ({orientations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orientations.length > 0 ? (
            <div className="space-y-3">
              {orientations.map((orientation: any) => (
                <div
                  key={orientation.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {orientation.orientation_title}
                      </span>
                      <StatusBadge status={orientation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {orientation.orientation_description}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      التاريخ:{' '}
                      {new Date(orientation.orientation_date).toLocaleDateString(
                        'ar-EG'
                      )}
                    </p>
                    {orientation.duration_hours && (
                      <p className="text-sm text-muted-foreground">
                        المدة: {orientation.duration_hours} ساعة
                      </p>
                    )}
                    {orientation.conducted_by_name && (
                      <p className="text-sm text-muted-foreground">
                        المدرب: {orientation.conducted_by_name}
                      </p>
                    )}
                  </div>
                  {orientation.completion_percentage !== null && (
                    <div className="text-left">
                      <div className="text-2xl font-bold">
                        {orientation.completion_percentage}%
                      </div>
                      <p className="text-xs text-muted-foreground">الإنجاز</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">لا توجد توجيهات بعد</p>
          )}
        </CardContent>
      </Card>

      {/* Tests */}
      <Card>
        <CardHeader>
          <CardTitle>الاختبارات ({tests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tests.length > 0 ? (
            <div className="space-y-3">
              {tests.map((test: any) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{test.test_title}</span>
                      <StatusBadge status={test.status} />
                      {test.passed !== null && (
                        <Badge variant={test.passed ? 'default' : 'destructive'}>
                          {test.passed ? 'ناجح' : 'راسب'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      النوع: {test.test_type}
                    </p>
                    {test.status === 'مكتمل' && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          التاريخ:{' '}
                          {new Date(test.test_date).toLocaleDateString('ar-EG')}
                        </p>
                        <p className="text-sm font-medium mt-2">
                          الدرجة: {test.score_obtained} / {test.total_score} (
                          {test.percentage}%)
                        </p>
                      </>
                    )}
                  </div>
                  {test.status !== 'مكتمل' && test.questions && (
                    <Button onClick={() => handleStartTest(test)}>
                      بدء الاختبار
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">لا توجد اختبارات بعد</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    مجدول: { variant: 'outline', icon: Clock },
    جاري: { variant: 'secondary', icon: Clock },
    مكتمل: { variant: 'default', icon: CheckCircle },
    ملغي: { variant: 'destructive', icon: XCircle },
  };

  const config = variants[status] || variants.مجدول;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3 h-3 ml-1" />
      {status}
    </Badge>
  );
}
