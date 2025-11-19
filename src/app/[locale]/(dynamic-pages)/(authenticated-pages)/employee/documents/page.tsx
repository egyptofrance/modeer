'use client';

import { useEffect, useState } from 'react';
import { getEmployeeByUserId } from '@/app/actions/employee-actions';
import {
  getEmployeeDocuments,
  uploadDocument,
  checkDocumentsComplete,
} from '@/app/actions/employee-extended-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileCheck, FileX, Eye } from 'lucide-react';
import { supabaseUserClientComponent } from '@/supabase-clients/user/supabaseUserClientComponent';

const DOCUMENTS = [
  { key: 'id_card_front', label: 'صورة البطاقة (وجه)', required: true },
  { key: 'id_card_back', label: 'صورة البطاقة (ظهر)', required: true },
  { key: 'utility_bill', label: 'إيصال مرافق', required: true },
  { key: 'birth_certificate', label: 'شهادة الميلاد', required: true },
  {
    key: 'qualification_certificate',
    label: 'المؤهل الدراسي',
    required: true,
  },
  {
    key: 'military_certificate',
    label: 'شهادة التجنيد',
    required: false,
    note: '(للذكور فقط)',
  },
  { key: 'application_form', label: 'صورة Application', required: true },
];

export default function EmployeeDocumentsPage() {
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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

        // Load documents
        const docsResult = await getEmployeeDocuments(emp.id);
        if (docsResult?.data) {
          setDocuments(docsResult.data);
        }

        // Check if complete
        const completeResult = await checkDocumentsComplete(emp.id);
        if (completeResult?.data !== null) {
          setIsComplete(completeResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    docKey: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !employee) return;

    try {
      setUploadingDoc(docKey);

      // Upload to Supabase Storage
      const supabase = supabaseUserClientComponent;
      const fileExt = file.name.split('.').pop();
      const fileName = `${employee.id}/${docKey}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Update database
      const result = await uploadDocument({
        employeeId: employee.id,
        documentType: docKey,
        filePath: uploadData.path,
      });

      if (result?.data) {
        toast.success('تم رفع المستند بنجاح');
        loadData(); // Reload
      } else {
        toast.error('فشل حفظ المستند');
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'فشل رفع المستند');
    } finally {
      setUploadingDoc(null);
    }
  };

  const getDocumentUrl = async (path: string) => {
    if (!path) return null;
    const supabase = supabaseUserClientComponent;
    const { data } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleViewDocument = async (path: string) => {
    const url = await getDocumentUrl(path);
    if (url) {
      window.open(url, '_blank');
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">مستنداتي</h1>
        {isComplete ? (
          <Badge variant="default" className="text-lg px-4 py-2">
            <FileCheck className="w-5 h-5 ml-2" />
            المستندات مكتملة
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <FileX className="w-5 h-5 ml-2" />
            المستندات غير مكتملة
          </Badge>
        )}
      </div>

      {/* Documents Status */}
      <Card>
        <CardHeader>
          <CardTitle>حالة المستندات</CardTitle>
        </CardHeader>
        <CardContent>
          {documents?.documents_complete ? (
            <div className="text-green-600 font-medium">
              ✓ جميع المستندات المطلوبة مكتملة
            </div>
          ) : (
            <div className="text-orange-600 font-medium">
              ⚠ يرجى رفع جميع المستندات المطلوبة
            </div>
          )}
          {documents?.documents_verified && (
            <div className="text-blue-600 font-medium mt-2">
              ✓ تم التحقق من المستندات بواسطة الإدارة
            </div>
          )}
          {documents?.notes && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="text-sm font-medium">ملاحظات الإدارة:</p>
              <p className="text-sm mt-1">{documents.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENTS.map((doc) => {
          const hasDocument = documents?.[doc.key];
          const isUploading = uploadingDoc === doc.key;

          return (
            <Card key={doc.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">
                    {doc.label}
                    {doc.required && <span className="text-red-500 mr-1">*</span>}
                    {doc.note && (
                      <span className="text-sm text-muted-foreground mr-2">
                        {doc.note}
                      </span>
                    )}
                  </span>
                  {hasDocument ? (
                    <Badge variant="default">
                      <FileCheck className="w-4 h-4" />
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <FileX className="w-4 h-4" />
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={doc.key}>اختر ملف</Label>
                  <Input
                    id={doc.key}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(doc.key, e)}
                    disabled={isUploading}
                  />
                </div>

                {hasDocument && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(documents[doc.key])}
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      عرض المستند
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="text-sm text-muted-foreground">
                    جاري الرفع...
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>تعليمات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">• يجب رفع جميع المستندات المطلوبة (المحددة بـ *)</p>
          <p className="text-sm">
            • شهادة التجنيد مطلوبة للموظفين الذكور فقط
          </p>
          <p className="text-sm">
            • يمكن رفع الملفات بصيغة صورة (JPG, PNG) أو PDF
          </p>
          <p className="text-sm">
            • سيتم مراجعة المستندات من قبل الإدارة بعد الرفع
          </p>
          <p className="text-sm">
            • يمكنك تحديث أي مستند بعد رفعه من خلال رفع ملف جديد
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
