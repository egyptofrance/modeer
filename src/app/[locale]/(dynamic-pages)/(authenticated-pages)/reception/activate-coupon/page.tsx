"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabaseUserClientComponent } from "@/supabase-clients/user/supabaseUserClientComponent";

export default function ActivateCouponPage() {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [customerData, setCustomerData] = useState<any>(null);

  const searchCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("يرجى إدخال رقم الكوبون");
      return;
    }

    setSearching(true);

    try {
      const supabase = supabaseUserClientComponent;
      
      const { data, error } = await supabase
        .from("customer_leads")
        .select("*")
        .eq("coupon_code", couponCode.trim())
        .single();

      if (error || !data) {
        toast.error("لم يتم العثور على الكوبون");
        setCustomerData(null);
        return;
      }

      if (data.coupon_status === "redeemed") {
        toast.warning("هذا الكوبون مفعل بالفعل!");
      }

      setCustomerData(data);
    } catch (error: any) {
      console.error("Error searching coupon:", error);
      toast.error("فشل البحث عن الكوبون");
      setCustomerData(null);
    } finally {
      setSearching(false);
    }
  };

  const activateCoupon = async () => {
    if (!customerData) return;

    if (customerData.coupon_status === "redeemed") {
      toast.error("هذا الكوبون مفعل بالفعل!");
      return;
    }

    setLoading(true);

    try {
      const supabase = supabaseUserClientComponent;
      
      const { error } = await supabase
        .from("customer_leads")
        .update({
          coupon_status: "redeemed",
          redeemed_at: new Date().toISOString(),
          incentive_amount: 50.00,
        })
        .eq("id", customerData.id);

      if (error) throw error;

      toast.success("تم تفعيل الكوبون بنجاح! 🎉");
      
      setCouponCode("");
      setCustomerData(null);
    } catch (error: any) {
      console.error("Error activating coupon:", error);
      toast.error("فشل تفعيل الكوبون: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "في الانتظار";
      case "redeemed": return "مفعل";
      case "expired": return "منتهي";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "redeemed": return "bg-green-500";
      case "expired": return "bg-red-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">تفعيل كوبون عميل</CardTitle>
          <p className="text-sm text-muted-foreground">
            ابحث عن الكوبون وقم بتفعيله عند وصول العميل
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coupon_code">رقم الكوبون</Label>
            <div className="flex gap-2">
              <Input
                id="coupon_code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="مثال: 1010001-123456"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchCoupon();
                  }
                }}
              />
              <Button onClick={searchCoupon} disabled={searching}>
                {searching ? "جاري البحث..." : "بحث"}
              </Button>
            </div>
          </div>

          {customerData && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">بيانات العميل</h3>
                <Badge className={getStatusColor(customerData.coupon_status)}>
                  {getStatusLabel(customerData.coupon_status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">رقم الكوبون</p>
                  <p className="font-semibold">{customerData.coupon_code}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">اسم العميل</p>
                  <p className="font-semibold">{customerData.customer_name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-semibold">{customerData.customer_phone}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">المنتج</p>
                  <p className="font-semibold">{customerData.product_interest}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">كود الموظف</p>
                  <p className="font-semibold">{customerData.call_center_employee_code}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">طريقة الاستلام</p>
                  <p className="font-semibold">
                    {customerData.delivery_method === "shipping_company" ? "شركة شحن" : "استلام شخصي"}
                  </p>
                </div>
              </div>

              {customerData.coupon_status === "pending" && (
                <Button 
                  onClick={activateCoupon} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "جاري التفعيل..." : "تفعيل الكوبون"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
