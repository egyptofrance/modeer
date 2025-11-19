'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, User, Package, Ticket, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function CallCenterCustomersPage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_interest: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/call-center/customers');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/call-center/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`تم تسجيل العميل بنجاح! كود الكوبون: ${data.coupon_code}`);
        setFormData({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          product_interest: '',
          notes: '',
        });
        setShowForm(false);
        loadData();
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'redeemed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 ml-1" />
            تم الاستخدام
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 ml-1" />
            قيد الانتظار
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            منتهي
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة العملاء</h1>
          <p className="text-muted-foreground">
            تسجيل العملاء المحتملين وإصدار كوبونات الخصم
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 ml-2" />
          تسجيل عميل جديد
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_leads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                عملاء جاءوا
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.redeemed_leads}
              </div>
              <p className="text-xs text-muted-foreground">
                معدل التحويل: {stats.conversion_rate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600">
                قيد الانتظار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending_leads}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600">
                الحوافز المستحقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.unpaid_incentives} جنيه
              </div>
              <p className="text-xs text-muted-foreground">
                تم الدفع: {stats.paid_incentives} جنيه
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>تسجيل عميل جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">اسم العميل *</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_name: e.target.value })
                      }
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer_phone">رقم التليفون *</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_phone: e.target.value })
                      }
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer_email">البريد الإلكتروني</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="product_interest">الجهاز المطلوب *</Label>
                  <div className="relative">
                    <Package className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="product_interest"
                      value={formData.product_interest}
                      onChange={(e) =>
                        setFormData({ ...formData, product_interest: e.target.value })
                      }
                      className="pr-10"
                      placeholder="مثال: لابتوب HP، طابعة Canon"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'جاري التسجيل...' : 'تسجيل العميل'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            قائمة العملاء والكوبونات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لم تسجل أي عملاء بعد</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                تسجيل عميل جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود الكوبون</TableHead>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>التليفون</TableHead>
                  <TableHead>الجهاز المطلوب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الحافز</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono font-bold">
                      {customer.coupon_code}
                    </TableCell>
                    <TableCell>{customer.customer_name}</TableCell>
                    <TableCell>{customer.customer_phone}</TableCell>
                    <TableCell>{customer.product_interest}</TableCell>
                    <TableCell>{getStatusBadge(customer.coupon_status)}</TableCell>
                    <TableCell>
                      {customer.incentive_amount > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {customer.incentive_amount} جنيه
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(customer.created_at).toLocaleDateString('ar-EG')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
