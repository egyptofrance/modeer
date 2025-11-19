'use client';

import { useEffect, useState } from 'react';
import {
  getAllEmployees,
  createOrientation,
  createTest,
  getAllOrientations,
  getAllTests,
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
import { Plus, BookOpen, FileQuestion, Trash2 } from 'lucide-react';

export default function TrainingPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [orientations, setOrientations] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrientationDialog, setShowOrientationDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [orientationForm, setOrientationForm] = useState({
    employee_id: '',
    orientation_title: '',
    orientation_description: '',
    orientation_type: 'تعريف بالشركة',
    duration_hours: 1,
    orientation_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [testForm, setTestForm] = useState({
    employee_id: '',
    test_title: '',
    test_description: '',
    test_type: 'تقييم أداء',
    total_score: 100,
    passing_score: 60,
    test_date: new Date().toISOString().split('T')[0],
    questions: [] as any[],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empResult, orientResult, testResult] = await Promise.all([
        getAllEmployees(),
        getAllOrientations(),
        getAllTests(),
      ]);

      if (empResult?.data) setEmployees(empResult.data);
      if (orientResult?.data) setOrientations(orientResult.data);
      if (testResult?.data) setTests(testResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleOrientationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orientationForm.employee_id || !orientationForm.orientation_title) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      setProcessing(true);
      const result = await createOrientation({
        ...orientationForm,
        conducted_by: 'admin-id',
        conducted_by_name: 'المدير',
      });

      if (result?.data) {
        toast.success('تم إضافة التوجيه بنجاح');
        setShowOrientationDialog(false);
        resetOrientationForm();
        loadData();
      } else {
        toast.error('فشل في إضافة التوجيه');
      }
    } catch (error) {
      console.error('Error creating orientation:', error);
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setProcessing(false);
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testForm.employee_id || !testForm.test_title) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (testForm.questions.length === 0) {
      toast.error('يرجى إضافة سؤال واحد على الأقل');
      return;
    }

    try {
      setProcessing(true);
      const result = await createTest({
        ...testForm,
        questions: testForm.questions,
        conducted_by: 'admin-id',
        conducted_by_name: 'المدير',
      });

      if (result?.data) {
        toast.success('تم إضافة الاختبار بنجاح');
        setShowTestDialog(false);
        resetTestForm();
        loadData();
      } else {
        toast.error('فشل في إضافة الاختبار');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setProcessing(false);
    }
  };

  const addQuestion = () => {
    if (
      !currentQuestion.question ||
      currentQuestion.options.some((opt) => !opt)
    ) {
      toast.error('يرجى ملء السؤال وجميع الخيارات');
      return;
    }

    setTestForm({
      ...testForm,
      questions: [...testForm.questions, { ...currentQuestion }],
    });

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    });

    toast.success('تم إضافة السؤال');
  };

  const removeQuestion = (index: number) => {
    setTestForm({
      ...testForm,
      questions: testForm.questions.filter((_, i) => i !== index),
    });
  };

  const resetOrientationForm = () => {
    setOrientationForm({
      employee_id: '',
      orientation_title: '',
      orientation_description: '',
      orientation_type: 'تعريف بالشركة',
      duration_hours: 1,
      orientation_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const resetTestForm = () => {
    setTestForm({
      employee_id: '',
      test_title: '',
      test_description: '',
      test_type: 'تقييم أداء',
      total_score: 100,
      passing_score: 60,
      test_date: new Date().toISOString().split('T')[0],
      questions: [],
    });
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    });
  };

  const OrientationCard = ({ orientation }: any) => (
    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold">{orientation.orientation_title}</h3>
          <p className="text-sm text-muted-foreground">
            {orientation.employees?.full_name} -{' '}
            {orientation.employees?.employee_types?.name}
          </p>
        </div>
        <Badge>{orientation.orientation_type}</Badge>
      </div>

      {orientation.orientation_description && (
        <p className="text-sm">{orientation.orientation_description}</p>
      )}

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>المدة: {orientation.duration_hours} ساعة</span>
        <span>
          التاريخ:{' '}
          {new Date(orientation.orientation_date).toLocaleDateString('ar-EG')}
        </span>
        <span>بواسطة: {orientation.conducted_by_name}</span>
      </div>
    </div>
  );

  const TestCard = ({ test }: any) => {
    const questions = test.questions || [];
    return (
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold">{test.test_title}</h3>
            <p className="text-sm text-muted-foreground">
              {test.employees?.full_name} - {test.employees?.employee_types?.name}
            </p>
          </div>
          <Badge>{test.test_type}</Badge>
        </div>

        {test.test_description && (
          <p className="text-sm">{test.test_description}</p>
        )}

        <div className="flex gap-4 text-sm">
          <span>الأسئلة: {questions.length}</span>
          <span>الدرجة الكلية: {test.total_score}</span>
          <span>درجة النجاح: {test.passing_score}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          التاريخ: {new Date(test.test_date).toLocaleDateString('ar-EG')} - بواسطة:{' '}
          {test.conducted_by_name}
        </div>
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
          <h1 className="text-3xl font-bold">التدريب والاختبارات</h1>
          <p className="text-muted-foreground mt-1">
            التوجيهات: {orientations.length} | الاختبارات: {tests.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowOrientationDialog(true)}>
            <BookOpen className="w-4 h-4 ml-2" />
            إضافة توجيه
          </Button>
          <Button onClick={() => setShowTestDialog(true)} variant="secondary">
            <FileQuestion className="w-4 h-4 ml-2" />
            إضافة اختبار
          </Button>
        </div>
      </div>

      <Tabs defaultValue="orientations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orientations">
            التوجيهات ({orientations.length})
          </TabsTrigger>
          <TabsTrigger value="tests">الاختبارات ({tests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orientations">
          <Card>
            <CardHeader>
              <CardTitle>التوجيهات التدريبية</CardTitle>
            </CardHeader>
            <CardContent>
              {orientations.length > 0 ? (
                <div className="space-y-4">
                  {orientations.map((orientation) => (
                    <OrientationCard key={orientation.id} orientation={orientation} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد توجيهات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>الاختبارات</CardTitle>
            </CardHeader>
            <CardContent>
              {tests.length > 0 ? (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <TestCard key={test.id} test={test} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد اختبارات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Orientation Dialog */}
      <Dialog open={showOrientationDialog} onOpenChange={setShowOrientationDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة توجيه تدريبي</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOrientationSubmit} className="space-y-4">
            <div>
              <Label>الموظف *</Label>
              <Select
                value={orientationForm.employee_id}
                onValueChange={(value) =>
                  setOrientationForm({ ...orientationForm, employee_id: value })
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
              <Label>عنوان التوجيه *</Label>
              <Input
                value={orientationForm.orientation_title}
                onChange={(e) =>
                  setOrientationForm({
                    ...orientationForm,
                    orientation_title: e.target.value,
                  })
                }
                placeholder="مثال: التعريف بنظام الشركة"
              />
            </div>

            <div>
              <Label>الوصف</Label>
              <Textarea
                value={orientationForm.orientation_description}
                onChange={(e) =>
                  setOrientationForm({
                    ...orientationForm,
                    orientation_description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع التوجيه</Label>
                <Select
                  value={orientationForm.orientation_type}
                  onValueChange={(value) =>
                    setOrientationForm({
                      ...orientationForm,
                      orientation_type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تعريف بالشركة">تعريف بالشركة</SelectItem>
                    <SelectItem value="سياسات العمل">سياسات العمل</SelectItem>
                    <SelectItem value="الأمن والسلامة">الأمن والسلامة</SelectItem>
                    <SelectItem value="تدريب فني">تدريب فني</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>المدة (ساعات)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={orientationForm.duration_hours}
                  onChange={(e) =>
                    setOrientationForm({
                      ...orientationForm,
                      duration_hours: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label>تاريخ التوجيه</Label>
                <Input
                  type="date"
                  value={orientationForm.orientation_date}
                  onChange={(e) =>
                    setOrientationForm({
                      ...orientationForm,
                      orientation_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowOrientationDialog(false);
                  resetOrientationForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'جاري الإضافة...' : 'إضافة التوجيه'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة اختبار</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div>
              <Label>الموظف *</Label>
              <Select
                value={testForm.employee_id}
                onValueChange={(value) =>
                  setTestForm({ ...testForm, employee_id: value })
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
              <Label>عنوان الاختبار *</Label>
              <Input
                value={testForm.test_title}
                onChange={(e) =>
                  setTestForm({ ...testForm, test_title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>نوع الاختبار</Label>
                <Select
                  value={testForm.test_type}
                  onValueChange={(value) =>
                    setTestForm({ ...testForm, test_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تقييم أداء">تقييم أداء</SelectItem>
                    <SelectItem value="اختبار فني">اختبار فني</SelectItem>
                    <SelectItem value="اختبار معرفي">اختبار معرفي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الدرجة الكلية</Label>
                <Input
                  type="number"
                  value={testForm.total_score}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      total_score: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>درجة النجاح</Label>
                <Input
                  type="number"
                  value={testForm.passing_score}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      passing_score: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Questions */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">الأسئلة ({testForm.questions.length})</h3>

              {testForm.questions.map((q, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">
                      {index + 1}. {q.question}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {q.options.map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`p-2 rounded ${
                          i === q.correct_answer
                            ? 'bg-green-100 font-medium'
                            : 'bg-white'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add Question Form */}
              <div className="p-4 bg-blue-50 rounded space-y-3">
                <h4 className="font-medium">إضافة سؤال جديد</h4>

                <div>
                  <Label>السؤال</Label>
                  <Input
                    value={currentQuestion.question}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        question: e.target.value,
                      })
                    }
                    placeholder="اكتب السؤال..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, i) => (
                    <div key={i}>
                      <Label>الخيار {String.fromCharCode(65 + i)}</Label>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[i] = e.target.value;
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: newOptions,
                          });
                        }}
                        placeholder={`الخيار ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <Label>الإجابة الصحيحة</Label>
                  <Select
                    value={currentQuestion.correct_answer.toString()}
                    onValueChange={(value) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        correct_answer: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentQuestion.options.map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          الخيار {String.fromCharCode(65 + i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" onClick={addQuestion} size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة السؤال
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTestDialog(false);
                  resetTestForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'جاري الإضافة...' : 'إضافة الاختبار'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
