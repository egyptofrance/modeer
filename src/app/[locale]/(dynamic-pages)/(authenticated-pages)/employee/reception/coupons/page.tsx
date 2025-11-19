'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ReceptionCouponsPage() {
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/reception/redeem-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: couponCode }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        toast.success('تم تفعيل الكوبون بنجاح!');
        setCouponCode('');
      } else {
        toast.error(data.error || 'حدث خطأ');
        setResult({ error: data.error });
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تفعيل كوبونات الخصم</h1>
        <p className="text-muted-foreground">
          أدخل كود الكوبون عند وصول العميل للشركة
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              تفعيل كوبون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <Label htmlFor="coupon_code">كود الكوبون</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="coupon_code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: 1010001-0001"
                    className="font-mono text-lg"
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={loading || !couponCode}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري التفعيل...
                      </>
                    ) : (
                      'تفعيل'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  اطلب من العميل كود الكوبون الذي حصل عليه من موظف الكول سنتر
                </p>
              </div>
            </form>

            {/* Result */}
            {result && (
              <div className="mt-6">
                {result.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900">فشل التفعيل</h3>
                        <p className="text-red-700 mt-1">{result.error}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 text-lg mb-4">
                          تم التفعيل بنجاح!
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white rounded">
                            <span className="text-muted-foreground">اسم العميل:</span>
                            <span className="font-semibold">{result.customer_name}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded">
                            <span className="text-muted-foreground">كود الموظف:</span>
                            <span className="font-mono font-semibold">
                              {result.employee_code}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded">
                            <span className="text-muted-foreground">حافز الموظف:</span>
                            <span className="font-semibold text-green-600 text-lg">
                              {result.incentive_amount} جنيه
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-green-700 mt-4">
                          تم تسجيل زيارة العميل وإضافة الحافز لحساب الموظف
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">تعليمات الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>اطلب من العميل كود الكوبون الذي حصل عليه</li>
              <li>أدخل الكود في الحقل أعلاه</li>
              <li>اضغط "تفعيل"</li>
              <li>سيتم تسجيل زيارة العميل تلقائياً</li>
              <li>سيحصل موظف الكول سنتر على حافز تلقائياً</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
