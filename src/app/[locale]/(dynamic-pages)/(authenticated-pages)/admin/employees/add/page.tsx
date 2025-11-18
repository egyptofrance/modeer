// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEmployee } from '@/app/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    employee_type_id: '',
    base_salary: '',
    code_prefix: ''
  });

  const employeeTypes = [
    { id: '1', name: 'موظف كول سنتر', code: '101' },
    { id: '2', name: 'موظف سائق', code: '201' },
    { id: '3', name: 'مندوب', code: '301' },
    { id: '4', name: 'موظف ريسبشن', code: '401' },
    { id: '5', name: 'فني صيانة', code: '501' },
    { id: '6', name: 'مدير قسم فني', code: '601' },
    { id: '7', name: 'مدير عام', code: '701' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createEmployee({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        employee_type_id: formData.employee_type_id,
        base_salary: parseFloat(formData.base_salary),
        code_prefix: formData.code_prefix
      });

      if (result) {
        toast.success('تم إضافة الموظف بنجاح!');
        router.push('/admin/employees');
      } else {
        toast.error('فشل في إضافة الموظف');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('حدث خطأ أثناء إضافة الموظف');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const type = employeeTypes.find(t => t.id === typeId);
    setFormData({
      ...formData,
      employee_type_id: typeId,
      code_prefix: type?.code || ''
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>إضافة موظف جديد</CardTitle>
          <CardDescription>
            أدخل بيانات الموظف الجديد وسيتم إنشاء حساب له تلقائياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="example@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="كلمة مرور قوية (6 أحرف على الأقل)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_type">نوع الوظيفة *</Label>
              <Select value={formData.employee_type_id} onValueChange={handleTypeChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوظيفة" />
                </SelectTrigger>
                <SelectContent>
                  {employeeTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} (كود: {type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code_prefix">بادئة الكود *</Label>
              <Input
                id="code_prefix"
                value={formData.code_prefix}
                onChange={(e) => setFormData({ ...formData, code_prefix: e.target.value })}
                required
                placeholder="101"
                disabled
              />
              <p className="text-sm text-muted-foreground">
                سيتم توليد كود الموظف تلقائياً بناءً على هذه البادئة
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">الراتب الأساسي (جنيه) *</Label>
              <Input
                id="base_salary"
                type="number"
                step="0.01"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                required
                placeholder="5000"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'جاري الإضافة...' : 'إضافة الموظف'}
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
