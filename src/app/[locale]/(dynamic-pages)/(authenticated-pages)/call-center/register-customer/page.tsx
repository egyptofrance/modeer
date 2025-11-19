"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterCustomerPage() {
  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل عميل جديد</CardTitle>
          <p className="text-sm text-muted-foreground">
            صفحة تسجيل العملاء - قيد الإنشاء
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-center py-12">
            سيتم إضافة نموذج تسجيل العملاء هنا قريباً
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
