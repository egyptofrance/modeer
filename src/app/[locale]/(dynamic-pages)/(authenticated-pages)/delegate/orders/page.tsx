'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck,
  AlertCircle,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  device_type: string;
  device_brand: string;
  problem_description: string;
  delivery_method: string;
  order_status: string;
  coupon_code: string;
  created_at: string;
  pickup_date: string | null;
  delivery_date: string | null;
  delegate_notes: string | null;
  call_center_employee_name: string;
}

interface Stats {
  total_orders: number;
  pending_orders: number;
  picked_up_orders: number;
  delivered_orders: number;
  completed_orders: number;
}

export default function DelegateOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'pickup' | 'deliver' | null>(null);
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchUserAndOrders();
  }, []);

  const fetchUserAndOrders = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول أولاً',
          variant: 'destructive',
        });
        return;
      }

      // Get employee ID
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) {
        toast({
          title: 'خطأ',
          description: 'لم يتم العثور على بيانات الموظف',
          variant: 'destructive',
        });
        return;
      }

      setUserId(employee.id);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .rpc('get_delegate_orders', { delegate_id: employee.id });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_delegate_stats', { delegate_id: employee.id });

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل الطلبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedOrder || !actionType || !userId) return;

    try {
      const newStatus = actionType === 'pickup' ? 'picked_up' : 'delivered';
      
      const { error } = await supabase.rpc('update_order_status', {
        order_id: selectedOrder.id,
        new_status: newStatus,
        delegate_id: userId,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: actionType === 'pickup' 
          ? 'تم تسجيل استلام الجهاز' 
          : 'تم تسجيل تسليم الجهاز',
      });

      setDialogOpen(false);
      setNotes('');
      setSelectedOrder(null);
      setActionType(null);
      fetchUserAndOrders();

    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الطلب',
        variant: 'destructive',
      });
    }
  };

  const openActionDialog = (order: Order, type: 'pickup' | 'deliver') => {
    setSelectedOrder(order);
    setActionType(type);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' as const },
      picked_up: { label: 'تم الاستلام', variant: 'default' as const },
      delivered: { label: 'تم التسليم', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliveryMethodLabel = (method: string) => {
    const methods = {
      delegate_pickup: 'مندوب يستلم الجهاز',
      shipping_company: 'شركة شحن',
      self_pickup: 'استلام شخصي',
    };
    return methods[method as keyof typeof methods] || method;
  };

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.order_status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">طلبات التوصيل</h1>
        <p className="text-gray-600">إدارة طلبات استلام وتوصيل الأجهزة</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">إجمالي الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">قيد الانتظار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">تم الاستلام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.picked_up_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">تم التسليم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">مكتمل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completed_orders}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">قيد الانتظار ({filterOrders('pending').length})</TabsTrigger>
          <TabsTrigger value="picked_up">تم الاستلام ({filterOrders('picked_up').length})</TabsTrigger>
          <TabsTrigger value="delivered">تم التسليم ({filterOrders('delivered').length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'picked_up', 'delivered'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {filterOrders(tabValue === 'all' ? 'all' : tabValue).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">لا توجد طلبات في هذه الفئة</p>
                  </CardContent>
                </Card>
              ) : (
                filterOrders(tabValue === 'all' ? 'all' : tabValue).map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{order.customer_name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span className="font-mono text-sm">{order.coupon_code}</span>
                            {getStatusBadge(order.order_status)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{getDeliveryMethodLabel(order.delivery_method)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">الهاتف:</span>
                            <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                              {order.customer_phone}
                            </a>
                          </div>
                          {order.customer_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">البريد:</span>
                              <span>{order.customer_email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">الجهاز:</span>
                            <span>{order.device_brand} {order.device_type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">موظف الكول سنتر:</span>
                            <span>{order.call_center_employee_name}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium block mb-1">المشكلة:</span>
                              <span className="text-gray-600">{order.problem_description}</span>
                            </div>
                          </div>
                          {order.delegate_notes && (
                            <div className="flex items-start gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                              <div>
                                <span className="font-medium block mb-1">ملاحظات:</span>
                                <span className="text-gray-600">{order.delegate_notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        {order.order_status === 'pending' && (
                          <Button 
                            onClick={() => openActionDialog(order, 'pickup')}
                            className="flex-1"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            تأكيد الاستلام
                          </Button>
                        )}
                        {order.order_status === 'picked_up' && (
                          <Button 
                            onClick={() => openActionDialog(order, 'deliver')}
                            className="flex-1"
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            تأكيد التسليم
                          </Button>
                        )}
                        {(order.order_status === 'delivered' || order.order_status === 'completed') && (
                          <div className="flex-1 text-center py-2 text-green-600 font-medium">
                            ✓ تم إنجاز الطلب
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'pickup' ? 'تأكيد استلام الجهاز' : 'تأكيد تسليم الجهاز'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'pickup' 
                ? 'قم بتأكيد استلام الجهاز من العميل'
                : 'قم بتأكيد تسليم الجهاز للشركة'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات هنا..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAction}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
