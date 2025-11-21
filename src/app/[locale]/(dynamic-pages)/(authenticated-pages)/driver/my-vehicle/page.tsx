'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getDriverVehicle,
  addOdometerReading,
  addFueling,
  addMaintenance,
  getOdometerReadings,
  getFuelingRecords,
  getMaintenanceRecords,
  createTrip,
  updateTripStatus,
  getTrips,
} from '@/app/actions/vehicle-actions';
import { getEmployeeData } from '@/app/actions/employee-extended-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gauge, 
  Fuel, 
  Wrench, 
  MapPin, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function DriverVehiclePage() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('odometer');
  
  // السجلات
  const [odometerReadings, setOdometerReadings] = useState<any[]>([]);
  const [fuelingRecords, setFuelingRecords] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  // نماذج الإدخال
  const [odometerForm, setOdometerForm] = useState({
    reading_type: 'start' as 'start' | 'end',
    reading_value: '',
    photo_url: '',
  });

  const [fuelingForm, setFuelingForm] = useState({
    amount_paid: '',
    liters: '',
    odometer_reading: '',
    photo_url: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: 'oil_change' as 'oil_change' | 'brake_pads' | 'tires' | 'other',
    description: '',
    amount_paid: '',
    odometer_reading: '',
    next_maintenance_km: '',
  });

  const [tripForm, setTripForm] = useState({
    client_name: '',
    pickup_location: '',
    delivery_location: '',
    items_description: '',
    items_photo_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const employeeResult = await getEmployeeData();
    if (employeeResult.error || !employeeResult.data) {
      toast.error('حدث خطأ في تحميل بيانات الموظف');
      setLoading(false);
      return;
    }

    const empId = (employeeResult.data as any).id;
    setEmployeeId(empId);

    const vehicleResult = await getDriverVehicle(empId);
    if (vehicleResult.error || !vehicleResult.data) {
      toast.error('لا توجد سيارة مرتبطة بك');
      setLoading(false);
      return;
    }

    const vehicleData = vehicleResult.data as any;
    setVehicle(vehicleData);

    // تحميل السجلات
    const [odometerResult, fuelingResult, maintenanceResult, tripsResult] = await Promise.all([
      getOdometerReadings(vehicleData.id),
      getFuelingRecords(vehicleData.id),
      getMaintenanceRecords(vehicleData.id),
      getTrips(vehicleData.id),
    ]);

    if (odometerResult.data) setOdometerReadings(odometerResult.data);
    if (fuelingResult.data) setFuelingRecords(fuelingResult.data);
    if (maintenanceResult.data) setMaintenanceRecords(maintenanceResult.data);
    if (tripsResult.data) setTrips(tripsResult.data);

    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, formType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (formType === 'odometer') {
          setOdometerForm((prev) => ({ ...prev, photo_url: base64 }));
        } else if (formType === 'fueling') {
          setFuelingForm((prev) => ({ ...prev, photo_url: base64 }));
        } else if (formType === 'trip') {
          setTripForm((prev) => ({ ...prev, items_photo_url: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOdometerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addOdometerReading({
      vehicle_id: vehicle.id,
      driver_id: employeeId,
      reading_type: odometerForm.reading_type,
      reading_value: parseInt(odometerForm.reading_value),
      photo_url: odometerForm.photo_url || undefined,
    });

    if (result.error) {
      toast.error('حدث خطأ أثناء إضافة قراءة العداد');
    } else {
      toast.success('تم إضافة قراءة العداد بنجاح!');
      setOdometerForm({ reading_type: 'start', reading_value: '', photo_url: '' });
      loadData();
    }

    setLoading(false);
  };

  const handleFuelingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addFueling({
      vehicle_id: vehicle.id,
      driver_id: employeeId,
      amount_paid: parseFloat(fuelingForm.amount_paid),
      liters: parseFloat(fuelingForm.liters),
      odometer_reading: fuelingForm.odometer_reading
        ? parseInt(fuelingForm.odometer_reading)
        : undefined,
      photo_url: fuelingForm.photo_url || undefined,
    });

    if (result.error) {
      toast.error('حدث خطأ أثناء إضافة التموين');
    } else {
      toast.success('تم إضافة التموين بنجاح!');
      setFuelingForm({ amount_paid: '', liters: '', odometer_reading: '', photo_url: '' });
      loadData();
    }

    setLoading(false);
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addMaintenance({
      vehicle_id: vehicle.id,
      driver_id: employeeId,
      maintenance_type: maintenanceForm.maintenance_type,
      description: maintenanceForm.description || undefined,
      amount_paid: parseFloat(maintenanceForm.amount_paid),
      odometer_reading: parseInt(maintenanceForm.odometer_reading),
      next_maintenance_km: maintenanceForm.next_maintenance_km
        ? parseInt(maintenanceForm.next_maintenance_km)
        : undefined,
    });

    if (result.error) {
      toast.error('حدث خطأ أثناء إضافة الصيانة');
    } else {
      toast.success('تم إضافة الصيانة بنجاح!');
      setMaintenanceForm({
        maintenance_type: 'oil_change',
        description: '',
        amount_paid: '',
        odometer_reading: '',
        next_maintenance_km: '',
      });
      loadData();
    }

    setLoading(false);
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createTrip({
      vehicle_id: vehicle.id,
      driver_id: employeeId,
      client_name: tripForm.client_name,
      pickup_location: tripForm.pickup_location,
      delivery_location: tripForm.delivery_location,
      items_description: tripForm.items_description || undefined,
      items_photo_url: tripForm.items_photo_url || undefined,
    });

    if (result.error) {
      toast.error('حدث خطأ أثناء إضافة الرحلة');
    } else {
      toast.success('تم إضافة الرحلة بنجاح!');
      setTripForm({
        client_name: '',
        pickup_location: '',
        delivery_location: '',
        items_description: '',
        items_photo_url: '',
      });
      loadData();
    }

    setLoading(false);
  };

  const handleTripStatusUpdate = async (tripId: string, status: string) => {
    setLoading(true);

    const now = new Date().toISOString();
    const pickupTime = status === 'in_progress' ? now : undefined;
    const deliveryTime = status === 'delivered' ? now : undefined;

    const result = await updateTripStatus(
      tripId,
      status as any,
      pickupTime,
      deliveryTime
    );

    if (result.error) {
      toast.error('حدث خطأ أثناء تحديث حالة الرحلة');
    } else {
      toast.success('تم تحديث حالة الرحلة بنجاح!');
      loadData();
    }

    setLoading(false);
  };

  // حساب التنبيهات
  const getMaintenanceAlert = () => {
    if (!maintenanceRecords.length || !odometerReadings.length) return null;

    const latestMaintenance = maintenanceRecords[0];
    const latestOdometer = odometerReadings[0];

    if (!latestMaintenance.next_maintenance_km || !latestOdometer.reading_value) return null;

    const remaining = latestMaintenance.next_maintenance_km - latestOdometer.reading_value;

    if (remaining < 100) {
      return { type: 'urgent', remaining };
    } else if (remaining < 500) {
      return { type: 'warning', remaining };
    }

    return null;
  };

  const maintenanceAlert = getMaintenanceAlert();

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { variant: 'secondary', label: 'قيد الانتظار' },
      in_progress: { variant: 'default', label: 'جاري التنفيذ' },
      delivered: { variant: 'success', label: 'تم التسليم' },
      cancelled: { variant: 'destructive', label: 'ملغاة' },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const types: any = {
      oil_change: 'تغيير زيت',
      brake_pads: 'تيل فرامل',
      tires: 'إطارات',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  if (loading && !vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>لا توجد سيارة مرتبطة بك</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* معلومات السيارة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">سيارتي - {vehicle.vehicle_number}</CardTitle>
          <CardDescription>رقم الشاسيه: {vehicle.chassis_number}</CardDescription>
        </CardHeader>
      </Card>

      {/* تنبيهات الصيانة */}
      {maintenanceAlert && (
        <Alert variant={maintenanceAlert.type === 'urgent' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {maintenanceAlert.type === 'urgent' ? (
              <>⚠️ <strong>عاجل!</strong> الصيانة القادمة بعد {maintenanceAlert.remaining} كم فقط!</>
            ) : (
              <>⏰ تنبيه: الصيانة القادمة بعد {maintenanceAlert.remaining} كم</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="odometer" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            قراءة العداد
          </TabsTrigger>
          <TabsTrigger value="fueling" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            التموين
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            الصيانة
            {maintenanceAlert && <Badge variant="destructive" className="mr-1">!</Badge>}
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            الرحلات
          </TabsTrigger>
        </TabsList>

        {/* قراءة العداد */}
        <TabsContent value="odometer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة قراءة العداد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOdometerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع القراءة</Label>
                    <Select
                      value={odometerForm.reading_type}
                      onValueChange={(value) =>
                        setOdometerForm({ ...odometerForm, reading_type: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">بداية اليوم</SelectItem>
                        <SelectItem value="end">نهاية اليوم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>قراءة العداد (كم)</Label>
                    <Input
                      type="number"
                      required
                      value={odometerForm.reading_value}
                      onChange={(e) =>
                        setOdometerForm({ ...odometerForm, reading_value: e.target.value })
                      }
                      placeholder="مثال: 15000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>صورة العداد</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'odometer')}
                  />
                  {odometerForm.photo_url && (
                    <img
                      src={odometerForm.photo_url}
                      alt="Odometer"
                      className="mt-2 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* سجل قراءات العداد */}
          <Card>
            <CardHeader>
              <CardTitle>السجل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {odometerReadings.map((reading) => (
                  <Card key={reading.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{reading.reading_value} كم</p>
                          <p className="text-sm text-gray-600">
                            {reading.reading_type === 'start' ? 'بداية اليوم' : 'نهاية اليوم'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(reading.reading_date).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        {reading.photo_url && (
                          <img
                            src={reading.photo_url}
                            alt="Odometer"
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التموين */}
        <TabsContent value="fueling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة تموين</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFuelingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>عدد اللترات</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={fuelingForm.liters}
                      onChange={(e) =>
                        setFuelingForm({ ...fuelingForm, liters: e.target.value })
                      }
                      placeholder="مثال: 40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>المبلغ المدفوع (جنيه)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={fuelingForm.amount_paid}
                      onChange={(e) =>
                        setFuelingForm({ ...fuelingForm, amount_paid: e.target.value })
                      }
                      placeholder="مثال: 500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>قراءة العداد (اختياري)</Label>
                    <Input
                      type="number"
                      value={fuelingForm.odometer_reading}
                      onChange={(e) =>
                        setFuelingForm({ ...fuelingForm, odometer_reading: e.target.value })
                      }
                      placeholder="مثال: 15000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>صورة مكينة الجاز</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'fueling')}
                  />
                  {fuelingForm.photo_url && (
                    <img
                      src={fuelingForm.photo_url}
                      alt="Fueling"
                      className="mt-2 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* سجل التموين */}
          <Card>
            <CardHeader>
              <CardTitle>السجل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fuelingRecords.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold">{record.liters} لتر</p>
                          <p className="text-sm text-gray-600">{record.amount_paid} جنيه</p>
                          {record.odometer_reading && (
                            <p className="text-sm text-gray-600">
                              العداد: {record.odometer_reading} كم
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(record.fueling_date).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        {record.photo_url && (
                          <img
                            src={record.photo_url}
                            alt="Fueling"
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الصيانة */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة صيانة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الصيانة</Label>
                    <Select
                      value={maintenanceForm.maintenance_type}
                      onValueChange={(value) =>
                        setMaintenanceForm({ ...maintenanceForm, maintenance_type: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oil_change">تغيير زيت</SelectItem>
                        <SelectItem value="brake_pads">تيل فرامل</SelectItem>
                        <SelectItem value="tires">إطارات</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>المبلغ المدفوع (جنيه)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={maintenanceForm.amount_paid}
                      onChange={(e) =>
                        setMaintenanceForm({ ...maintenanceForm, amount_paid: e.target.value })
                      }
                      placeholder="مثال: 300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>قراءة العداد الحالية (كم)</Label>
                    <Input
                      type="number"
                      required
                      value={maintenanceForm.odometer_reading}
                      onChange={(e) =>
                        setMaintenanceForm({ ...maintenanceForm, odometer_reading: e.target.value })
                      }
                      placeholder="مثال: 15000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الصيانة القادمة عند (كم)</Label>
                    <Input
                      type="number"
                      value={maintenanceForm.next_maintenance_km}
                      onChange={(e) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          next_maintenance_km: e.target.value,
                        })
                      }
                      placeholder="مثال: 20000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Input
                    value={maintenanceForm.description}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
                    }
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* سجل الصيانة */}
          <Card>
            <CardHeader>
              <CardTitle>السجل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceRecords.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {getMaintenanceTypeLabel(record.maintenance_type)}
                            </p>
                            <p className="text-sm text-gray-600">{record.amount_paid} جنيه</p>
                          </div>
                          <Badge variant="secondary">{record.odometer_reading} كم</Badge>
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-600">{record.description}</p>
                        )}
                        {record.next_maintenance_km && (
                          <p className="text-sm text-blue-600">
                            الصيانة القادمة: {record.next_maintenance_km} كم
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(record.maintenance_date).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الرحلات */}
        <TabsContent value="trips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة رحلة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTripSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم العميل</Label>
                    <Input
                      required
                      value={tripForm.client_name}
                      onChange={(e) =>
                        setTripForm({ ...tripForm, client_name: e.target.value })
                      }
                      placeholder="مثال: محمد أحمد"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>موقع الاستلام</Label>
                    <Input
                      required
                      value={tripForm.pickup_location}
                      onChange={(e) =>
                        setTripForm({ ...tripForm, pickup_location: e.target.value })
                      }
                      placeholder="مثال: المعادي"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>موقع التسليم</Label>
                    <Input
                      required
                      value={tripForm.delivery_location}
                      onChange={(e) =>
                        setTripForm({ ...tripForm, delivery_location: e.target.value })
                      }
                      placeholder="مثال: مدينة نصر"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>وصف البضاعة (اختياري)</Label>
                    <Input
                      value={tripForm.items_description}
                      onChange={(e) =>
                        setTripForm({ ...tripForm, items_description: e.target.value })
                      }
                      placeholder="مثال: 5 كراتين"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>صورة البضاعة (اختياري)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'trip')}
                  />
                  {tripForm.items_photo_url && (
                    <img
                      src={tripForm.items_photo_url}
                      alt="Items"
                      className="mt-2 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'جاري الحفظ...' : 'إضافة الرحلة'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* سجل الرحلات */}
          <Card>
            <CardHeader>
              <CardTitle>الرحلات الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trips.map((trip) => (
                  <Card key={trip.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{trip.client_name}</p>
                            <p className="text-sm text-gray-600">
                              من: {trip.pickup_location}
                            </p>
                            <p className="text-sm text-gray-600">
                              إلى: {trip.delivery_location}
                            </p>
                          </div>
                          {getStatusBadge(trip.status)}
                        </div>

                        {trip.items_description && (
                          <p className="text-sm text-gray-600">
                            البضاعة: {trip.items_description}
                          </p>
                        )}

                        {trip.items_photo_url && (
                          <img
                            src={trip.items_photo_url}
                            alt="Items"
                            className="w-full h-32 object-cover rounded"
                          />
                        )}

                        {trip.pickup_time && (
                          <p className="text-xs text-gray-500">
                            وقت الاستلام: {new Date(trip.pickup_time).toLocaleString('ar-EG')}
                          </p>
                        )}

                        {trip.delivery_time && (
                          <p className="text-xs text-gray-500">
                            وقت التسليم: {new Date(trip.delivery_time).toLocaleString('ar-EG')}
                          </p>
                        )}

                        {/* أزرار تحديث الحالة */}
                        <div className="flex gap-2 pt-2">
                          {trip.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleTripStatusUpdate(trip.id, 'in_progress')}
                              disabled={loading}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              بدء الرحلة
                            </Button>
                          )}

                          {trip.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleTripStatusUpdate(trip.id, 'delivered')}
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              تم التسليم
                            </Button>
                          )}

                          {(trip.status === 'pending' || trip.status === 'in_progress') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTripStatusUpdate(trip.id, 'cancelled')}
                              disabled={loading}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {trips.length === 0 && (
                  <p className="text-center text-gray-500 py-8">لا توجد رحلات حتى الآن</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
