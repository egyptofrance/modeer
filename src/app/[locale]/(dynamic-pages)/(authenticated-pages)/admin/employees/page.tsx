// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEmployees, deleteEmployee, updateEmployee } from '@/app/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const employeeTypeNames = {
    '1': 'كول سنتر',
    '2': 'سائق',
    '3': 'مندوب',
    '4': 'ريسبشن',
    '5': 'فني صيانة',
    '6': 'مدير قسم فني',
    '7': 'مدير عام'
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const result = await getAllEmployees();
      if (result) {
        setEmployees(result);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('فشل في تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      return;
    }

    try {
      const result = await deleteEmployee({ employee_id: employeeId });
      if (result) {
        toast.success('تم حذف الموظف بنجاح');
        loadEmployees();
      } else {
        toast.error('فشل في حذف الموظف');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('حدث خطأ أثناء حذف الموظف');
    }
  };

  const toggleActive = async (employee: any) => {
    try {
      const result = await updateEmployee({
        employee_id: employee.id,
        is_active: !employee.is_active
      });
      
      if (result) {
        toast.success(employee.is_active ? 'تم تعطيل الموظف' : 'تم تفعيل الموظف');
        loadEmployees();
      } else {
        toast.error('فشل في تحديث حالة الموظف');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الموظف');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8" dir="rtl">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>إدارة الموظفين</CardTitle>
              <CardDescription>
                عرض وإدارة جميع الموظفين في النظام
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/admin/employees/add')}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة موظف جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد موظفين حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>نوع الوظيفة</TableHead>
                    <TableHead>الراتب الأساسي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee: any) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono">{employee.employee_code}</TableCell>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {employeeTypeNames[employee.employee_type_id] || 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.base_salary} جنيه</TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(employee)}
                          >
                            {employee.is_active ? 'تعطيل' : 'تفعيل'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
