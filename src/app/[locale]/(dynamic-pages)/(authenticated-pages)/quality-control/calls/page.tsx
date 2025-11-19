"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneCall, Search, Filter, Star, AlertCircle, CheckCircle } from "lucide-react";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { toast } from "sonner";

interface CallRecord {
  id: string;
  customer_id: string;
  employee_id: string;
  call_date: string;
  call_duration: number;
  call_notes: string;
  call_status: string;
  customers: {
    full_name: string;
    phone: string;
  } | null;
  employees: {
    full_name: string;
  } | null;
}

interface CallEvaluation {
  id: string;
  call_id: string;
  evaluator_id: string;
  rating: number;
  notes: string;
  created_at: string;
}

export default function QualityControlCallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({
    rating: 5,
    notes: "",
  });

  useEffect(() => {
    loadCalls();
  }, [filterStatus]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      
      let query = (supabaseAdminClient as any)
        .from("call_logs")
        .select(`
          *,
          customers(full_name, phone),
          employees(full_name)
        `)
        .order("call_date", { ascending: false })
        .limit(100);

      if (filterStatus !== "all") {
        query = query.eq("call_status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCalls(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      toast.error("فشل تحميل المكالمات: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (callId: string) => {
    try {
      const { error } = await (supabaseAdminClient as any)
        .from("call_evaluations")
        .insert({
          call_id: callId,
          rating: evaluationForm.rating,
          notes: evaluationForm.notes,
        });

      if (error) throw error;

      toast.success("تم تقييم المكالمة بنجاح");
      setSelectedCall(null);
      setEvaluationForm({ rating: 5, notes: "" });
      loadCalls();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      toast.error("فشل تقييم المكالمة: " + errorMessage);
    }
  };

  const filteredCalls = calls.filter((call) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      call.customers?.full_name.toLowerCase().includes(searchLower) ||
      call.customers?.phone.includes(searchTerm) ||
      call.employees?.full_name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: { label: "مكتملة", className: "bg-green-100 text-green-800" },
      missed: { label: "فائتة", className: "bg-red-100 text-red-800" },
      in_progress: { label: "جارية", className: "bg-blue-100 text-blue-800" },
    };
    return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PhoneCall className="h-8 w-8" />
          مراقبة جودة المكالمات
        </h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="حالة المكالمة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المكالمات</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="missed">فائتة</SelectItem>
            <SelectItem value="in_progress">جارية</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={loadCalls} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Calls List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              لا توجد مكالمات
            </CardContent>
          </Card>
        ) : (
          filteredCalls.map((call) => {
            const statusInfo = getStatusBadge(call.call_status);
            return (
              <Card key={call.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {call.customers?.full_name || "غير محدد"}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {call.customers?.phone || "لا يوجد رقم"}
                      </p>
                      <p className="text-sm text-gray-500">
                        الموظف: {call.employees?.full_name || "غير محدد"}
                      </p>
                    </div>
                    <Badge className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">التاريخ</p>
                      <p className="font-medium">
                        {new Date(call.call_date).toLocaleString("ar-EG")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">المدة</p>
                      <p className="font-medium">{call.call_duration} دقيقة</p>
                    </div>
                  </div>

                  {call.call_notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">ملاحظات المكالمة</p>
                      <p className="text-sm mt-1">{call.call_notes}</p>
                    </div>
                  )}

                  {selectedCall?.id === call.id ? (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-3">تقييم المكالمة</h3>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          التقييم (1-5)
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() =>
                                setEvaluationForm({ ...evaluationForm, rating })
                              }
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  rating <= evaluationForm.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          ملاحظات التقييم
                        </label>
                        <Textarea
                          value={evaluationForm.notes}
                          onChange={(e) =>
                            setEvaluationForm({
                              ...evaluationForm,
                              notes: e.target.value,
                            })
                          }
                          placeholder="أضف ملاحظاتك حول جودة المكالمة..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleEvaluate(call.id)}>
                          <CheckCircle className="h-4 w-4 ml-2" />
                          حفظ التقييم
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCall(null);
                            setEvaluationForm({ rating: 5, notes: "" });
                          }}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedCall(call)}
                      variant="outline"
                      size="sm"
                    >
                      تقييم المكالمة
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
