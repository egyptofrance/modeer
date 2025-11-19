'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEmployeeProfile } from '@/app/actions/admin-create-employee';
import { getEmployeeData } from '@/app/actions/employee-extended-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, UserCheck } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    qualification_level: '',
    qualification_name: '',
    address: '',
    gender: '',
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const result = await getEmployeeData();
      if (result.data) {
        const employee = result.data as any;
        setCurrentData(employee);
        setEmployeeId(employee.id);
        setFormData({
          full_name: employee.full_name || '',
          phone: employee.phone || '',
          date_of_birth: employee.date_of_birth || '',
          qualification_level: employee.qualification_level || '',
          qualification_name: employee.qualification_name || '',
          address: employee.address || '',
          gender: employee.gender || '',
        });
      } else {
        toast.error('فشل في تحميل بيانات الموظف');
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error('لم يتم العثور على معرف الموظف');
      return;
    }

    if (!formData.full_name || !formData.phone) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    setLoading(true);

    try {
      const result = await updateEmployeeProfile({
        employee_id: employeeId,
        full_name: formData.full_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth || undefined,
        qualification_level: formData.qualification_level || undefined,
        qualification_name: formData.qualification_name || undefined,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('تم تحديث بياناتك بنجاح!');
        router.push('/employee/my-data');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // إذا كانت البيانات مكتملة، إعادة التوجيه
  const isProfileComplete =
    currentData?.date_of_birth &&
    currentData?.qualification_level &&
    currentData?.address &&
    currentData?.gender;

  return (
    <div className="container mx-auto py-8 max-w-4xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            {isProfileComplete ? 'تحديث البيانات الشخصية' : 'إكمال البيانات الشخصية'}
          </CardTitle>
          <CardDescription>
            {isProfileComplete
              ? 'يمكنك تحديث بياناتك الشخصية في أي وقت'
              : 'يرجى إكمال بياناتك الشخصية للاستفادة الكاملة من النظام'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* البيانات الأساسية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                البيانات الأساسية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* البيانات الشخصية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                البيانات الشخصية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_of_birth: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">الجنس</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ذكر">ذكر</SelectItem>
                      <SelectItem value="أنثى">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* المؤهلات الدراسية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                المؤهلات الدراسية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualification_level">المؤهل الدراسي</Label>
                  <Select
                    value={formData.qualification_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, qualification_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المؤهل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="دبلوم">دبلوم</SelectItem>
                      <SelectItem value="ثانوي عام">ثانوي عام</SelectItem>
                      <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                      <SelectItem value="ماجستير">ماجستير</SelectItem>
                      <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification_name">اسم المؤهل</Label>
                  <Input
                    id="qualification_name"
                    value={formData.qualification_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualification_name: e.target.value,
                      })
                    }
                    placeholder="مثال: بكالوريوس تجارة"
                  />
                </div>
              </div>
            </div>

            {/* العنوان */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">العنوان</h3>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان الكامل</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="أدخل العنوان الكامل"
                />
              </div>
            </div>

            {/* معلومات الحساب (للعرض فقط) */}
            {currentData && (
              <div className="space-y-4 bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-semibold">معلومات الحساب</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">رقم الموظف:</span>{' '}
                    {currentData.employee_code}
                  </div>
                  <div>
                    <span className="font-medium">البريد الإلكتروني:</span>{' '}
                    {currentData.email}
                  </div>
                  <div>
                    <span className="font-medium">الوظيفة:</span>{' '}
                    {currentData.employee_types?.name}
                  </div>
                  <div>
                    <span className="font-medium">تاريخ التعيين:</span>{' '}
                    {currentData.hire_date}
                  </div>
                </div>
              </div>
            )}

            {/* الأزرار */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ البيانات
                  </>
                )}
              </Button>
              {isProfileComplete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/employee/my-data')}
                  disabled={loading}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
