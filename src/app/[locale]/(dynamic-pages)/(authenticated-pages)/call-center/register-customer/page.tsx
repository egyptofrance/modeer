"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabaseUserClientComponent } from "@/supabase-clients/user/supabaseUserClientComponent";

export default function RegisterCustomerPage() {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    product_interest: "",
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
      
      // Generate simple coupon code
      const timestamp = Date.now().toString().slice(-6);
      const couponCode = `${employeeCode}-${timestamp}`;

      const { error } = await supabase
        .from("customer_leads")
        .insert({
          call_center_employee_id: employeeId,
          call_center_employee_code: employeeCode,
          coupon_code: couponCode,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          product_interest: formData.product_interest,
          coupon_status: "pending",
        });

      if (error) throw error;

      toast.success(`تم تسجيل العميل بنجاح! رقم الكوبون: ${couponCode}`);
      
      // Reset form
      setFormData({
        customer_name: "",
        customer_phone: "",
        product_interest: "",
      });
    } catch (error: any) {
      console.error("Error registering customer:", error);
      toast.error("فشل تسجيل العميل: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل عميل جديد</CardTitle>
          <p className="text-sm text-muted-foreground">
            أدخل بيانات العميل
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="product_interest">المنتج المهتم به *</Label>
                <Input
                  id="product_interest"
                  value={formData.product_interest}
                  onChange={(e) => setFormData({ ...formData, product_interest: e.target.value })}
                  placeholder="مثال: iPhone 13"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جاري التسجيل..." : "تسجيل العميل"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
