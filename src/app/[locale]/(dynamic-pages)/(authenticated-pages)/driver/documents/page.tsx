"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { toast } from "sonner";
import { getEmployeeData } from "@/app/actions/employee-extended-actions";

interface DriverDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_url: string;
  uploaded_at: string;
  expiry_date?: string;
}

export default function DriverDocumentsPage() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const documentTypes = [
    { key: "id_card_front", label: "بطاقة الهوية (الوجه الأمامي)" },
    { key: "id_card_back", label: "بطاقة الهوية (الوجه الخلفي)" },
    { key: "driving_license_front", label: "رخصة القيادة (الوجه الأمامي)" },
    { key: "driving_license_back", label: "رخصة القيادة (الوجه الخلفي)" },
  ];

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const employee = await getEmployeeData();
      if (employee) {
        setEmployeeId(employee.id);
        await loadDocuments(employee.id);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      toast.error("فشل تحميل بيانات الموظف: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (empId: string) => {
    try {
      const { data, error } = await (supabaseAdminClient as any)
        .from("employee_documents")
        .select("*")
        .eq("employee_id", empId)
        .in("document_type", documentTypes.map(d => d.key));

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      toast.error("فشل تحميل الوثائق: " + errorMessage);
    }
  };

  const handleFileUpload = async (
    file: File,
    documentType: string
  ) => {
    if (!employeeId) {
      toast.error("لم يتم العثور على بيانات الموظف");
      return;
    }

    try {
      setUploading(true);

      // رفع الملف إلى Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${employeeId}/${documentType}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await (supabaseAdminClient as any)
        .storage
        .from("employee-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // الحصول على URL العام
      const { data: urlData } = (supabaseAdminClient as any)
        .storage
        .from("employee-documents")
        .getPublicUrl(fileName);

      // حفظ معلومات الوثيقة في قاعدة البيانات
      const { error: dbError } = await (supabaseAdminClient as any)
        .from("employee_documents")
        .upsert({
          employee_id: employeeId,
          document_type: documentType,
          document_url: urlData.publicUrl,
        }, {
          onConflict: "employee_id,document_type"
        });

      if (dbError) throw dbError;

      toast.success("تم رفع الوثيقة بنجاح");
      await loadDocuments(employeeId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      toast.error("فشل رفع الوثيقة: " + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find((d) => d.document_type === docType);
    return doc ? "uploaded" : "missing";
  };

  const getDocumentUrl = (docType: string) => {
    const doc = documents.find((d) => d.document_type === docType);
    return doc?.document_url;
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          وثائق السائق
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.key);
          const documentUrl = getDocumentUrl(docType.key);

          return (
            <Card key={docType.key}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{docType.label}</span>
                  {status === "uploaded" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {status === "uploaded" && documentUrl ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={documentUrl}
                        alt={docType.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(documentUrl, "_blank")}
                        className="flex-1"
                      >
                        <ImageIcon className="h-4 w-4 ml-2" />
                        عرض
                      </Button>
                      <Label
                        htmlFor={`upload-${docType.key}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2 h-9 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                          <Upload className="h-4 w-4" />
                          تحديث
                        </div>
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">لم يتم رفع الوثيقة بعد</p>
                    </div>
                    <Label
                      htmlFor={`upload-${docType.key}`}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                        <Upload className="h-4 w-4" />
                        رفع الوثيقة
                      </div>
                    </Label>
                  </div>
                )}

                <Input
                  id={`upload-${docType.key}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, docType.key);
                    }
                  }}
                  disabled={uploading}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p>جاري رفع الوثيقة...</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
