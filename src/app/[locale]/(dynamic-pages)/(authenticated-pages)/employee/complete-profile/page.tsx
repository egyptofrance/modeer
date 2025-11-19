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
import { Loader2, Save, UserCheck, Upload } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    qualification_level: '',
    qualification_name: '',
    address: '',
    gender: '',
    personal_phone: '',
    relative_name: '',
    relative_phone: '',
    relative_relation: '',
    company_phone: '',
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const result = await getEmployeeData();
      if (result.data) {
        const data = result.data as any;
        setEmployeeId(data.id);
        setCurrentData(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          date_of_birth: data.extended_data?.date_of_birth || '',
          qualification_level: data.extended_data?.qualification_level || '',
          qualification_name: data.extended_data?.qualification_name || '',
          address: data.extended_data?.address || '',
          gender: data.extended_data?.gender || '',
          personal_phone: data.extended_data?.personal_phone || '',
          relative_name: data.extended_data?.relative_name || '',
          relative_phone: data.extended_data?.relative_phone || '',
          relative_relation: data.extended_data?.relative_relation || '',
          company_phone: data.extended_data?.company_phone || '',
        });
        if (data.extended_data?.profile_photo_url) {
          setPhotoPreview(data.extended_data.profile_photo_url);
        }
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error('لم يتم العثور على بيانات الموظف');
      return;
    }

    setLoading(true);
    try {
      // TODO: رفع الصورة إلى Supabase Storage
      let photoUrl = currentData?.extended_data?.profile_photo_url;
      
      if (photoFile) {
        // سيتم إضافة كود رفع الصورة لاحقاً
        toast.info('رفع الصور سيتم إضافته قريباً');
      }

      const result = await updateEmployeeProfile({
        employee_id: employeeId,
        ...formData,
        profile_photo_url: photoUrl,
      });

      if (result.error) {
        toast.error('حدث خطأ أثناء حفظ البيانات');
      } else {
        toast.success('تم حفظ البيانات بنجاح!');
        router.push('/employee/dashboard');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('حدث خطأ أثناء حفظ البيانات');
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

  return (
    <div className="container mx-auto py-8 max-w-4xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            إكمال البيانات الشخصية
          </CardTitle>
          <CardDescription>
            يرجى إكمال بياناتك الشخصية لتفعيل حسابك بالكامل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* الصورة الشخصية */}
            <div className="space-y-2">
              <Label>الصورة الشخصية</Label>
              <div className="flex items-center gap-4">
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="صورة شخصية"
                    className="w-24 h-24 rounded-full object-cover border-2"
                  />
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    اختر صورة شخصية واضحة
                  </p>
                </div>
              </div>
            </div>

            {/* البيانات الأساسية */}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">الجنس *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* أرقام التليفونات */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">أرقام التليفونات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم تليفون العمل *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personal_phone">رقم التليفون الشخصي</Label>
                  <Input
                    id="personal_phone"
                    type="tel"
                    value={formData.personal_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_phone">رقم تليفون الشركة</Label>
                  <Input
                    id="company_phone"
                    type="tel"
                    value={formData.company_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, company_phone: e.target.value })
                    }
                    placeholder="إن وجد"
                  />
                </div>
              </div>
            </div>

            {/* بيانات القريب */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">بيانات قريب (للطوارئ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="relative_name">اسم القريب</Label>
                  <Input
                    id="relative_name"
                    value={formData.relative_name}
                    onChange={(e) =>
                      setFormData({ ...formData, relative_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relative_relation">صلة القرابة</Label>
                  <Select
                    value={formData.relative_relation}
                    onValueChange={(value) =>
                      setFormData({ ...formData, relative_relation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صلة القرابة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أب">أب</SelectItem>
                      <SelectItem value="أم">أم</SelectItem>
                      <SelectItem value="أخ">أخ</SelectItem>
                      <SelectItem value="أخت">أخت</SelectItem>
                      <SelectItem value="زوج">زوج</SelectItem>
                      <SelectItem value="زوجة">زوجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relative_phone">رقم تليفون القريب</Label>
                  <Input
                    id="relative_phone"
                    type="tel"
                    value={formData.relative_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relative_phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* المؤهلات */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">المؤهلات الدراسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualification_level">المستوى التعليمي</Label>
                  <Select
                    value={formData.qualification_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, qualification_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ثانوية عامة">ثانوية عامة</SelectItem>
                      <SelectItem value="دبلوم">دبلوم</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="العنوان الكامل"
              />
            </div>

            {/* الأزرار */}
            <div className="flex gap-4">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
