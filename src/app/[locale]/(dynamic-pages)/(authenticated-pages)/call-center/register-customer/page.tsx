'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabaseUserClientComponent } from "@/supabase-clients/user/supabaseUserClientComponent";

export default function RegisterCustomerPage() {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    product_interest: "",
    device_brand: "",
    problem_description: "",
    delivery_method: "self_pickup" as "self_pickup" | "shipping_company" | "delegate_pickup",
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const supabase = supabaseUserClientComponent;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const { data: employee, error } = await supabase
        .from("employees")
        .select("id, employee_code")
        .eq("user_id", user.id)
        .single();

      if (error || !employee) {
        toast.error("فشل تحميل بيانات الموظف");
        return;
      }

      setEmployeeId(employee.id);
      setEmployeeCode(employee.employee_code);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeCode || !employeeId) {
      toast.error("فشل تحميل بيانات الموظف");
      return;
    }

    if (!formData.customer_name || !formData.customer_phone || !formData.product_interest) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }

    setLoading(true);

    try {
      const supabase = supabaseUserClientComponent;
      
      // استدعاء دالة توليد الكود المتسلسل من قاعدة البيانات
      const { data: couponData, error: couponError } = await supabase
        .rpc('generate_coupon_code', { p_employee_code: employeeCode });

      if (couponError) {
        console.error("Error generating coupon code:", couponError);
        toast.error("فشل توليد كود الكوبون");
        setLoading(false);
        return;
      }

      const couponCode = couponData as string;

      // إدراج بيانات العميل الجديد
      const { error } = await supabase
        .from("customer_leads")
        .insert({
          call_center_employee_id: employeeId,
          call_center_employee_code: employeeCode,
          coupon_code: couponCode,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email || null,
          product_interest: formData.product_interest,
          device_brand: formData.device_brand || null,
          problem_description: formData.problem_description || null,
          delivery_method: formData.delivery_method,
          coupon_status: "pending",
        });

      if (error) throw error;

      toast.success(`تم تسجيل العميل بنجاح! 🎉\nرقم الكوبون: ${couponCode}`, {
        duration: 5000,
      });
      
      // Reset form
      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        product_interest: "",
        device_brand: "",
        problem_description: "",
        delivery_method: "self_pickup",
      });
    } catch (error: any) {
      console.error("Error registering customer:", error);
      toast.error("فشل تسجيل العميل: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل عميل جديد</CardTitle>
          <p className="text-sm text-muted-foreground">
            أدخل بيانات العميل وتفاصيل الجهاز
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات العميل */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">معلومات العميل</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">اسم العميل *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="أدخل اسم العميل"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer_phone">رقم الهاتف *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="customer_email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>

            {/* معلومات الجهاز */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">معلومات الجهاز</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_interest">نوع الجهاز *</Label>
                  <Input
                    id="product_interest"
                    value={formData.product_interest}
                    onChange={(e) => setFormData({ ...formData, product_interest: e.target.value })}
                    placeholder="مثال: iPhone, لابتوب, تابلت"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="device_brand">ماركة الجهاز *</Label>
                  <Input
                    id="device_brand"
                    value={formData.device_brand}
                    onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
                    placeholder="مثال: Apple, Samsung, HP"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="problem_description">وصف المشكلة أو الشكوى *</Label>
                  <Textarea
                    id="problem_description"
                    value={formData.problem_description}
                    onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                    placeholder="اشرح المشكلة التي يعاني منها الجهاز..."
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            {/* طريقة الخدمة */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">طريقة الخدمة</h3>
              
              <div>
                <Label>كيف سيتم استلام/توصيل الجهاز؟ *</Label>
                <RadioGroup
                  value={formData.delivery_method}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    delivery_method: value as "self_pickup" | "shipping_company" | "delegate_pickup" 
                  })}
                  className="flex flex-col gap-3 mt-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="self_pickup" id="self_pickup" />
                    <Label htmlFor="self_pickup" className="cursor-pointer flex-1">
                      <div className="font-medium">استلام شخصي</div>
                      <div className="text-sm text-muted-foreground">العميل سيأتي بنفسه إلى المقر</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="delegate_pickup" id="delegate_pickup" />
                    <Label htmlFor="delegate_pickup" className="cursor-pointer flex-1">
                      <div className="font-medium">مندوب يستلم الجهاز</div>
                      <div className="text-sm text-muted-foreground">سيتم إرسال مندوب لاستلام الجهاز من العميل</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="shipping_company" id="shipping_company" />
                    <Label htmlFor="shipping_company" className="cursor-pointer flex-1">
                      <div className="font-medium">شركة شحن</div>
                      <div className="text-sm text-muted-foreground">سيتم التنسيق مع شركة شحن لاستلام/توصيل الجهاز</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "جاري التسجيل..." : "تسجيل العميل"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
