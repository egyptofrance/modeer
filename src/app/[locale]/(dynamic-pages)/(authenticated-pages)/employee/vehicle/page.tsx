'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createTrip, updateTripStatus, getTrips } from '@/app/actions/vehicle-actions';
import { getEmployeeData } from '@/app/actions/employee-extended-actions';

export default function EmployeeVehiclePage() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

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

    // الحصول على بيانات الموظف
    const employeeResult = await getEmployeeData();
    if (employeeResult.error || !employeeResult.data) {
      toast.error('حدث خطأ في تحميل بيانات الموظف');
      setLoading(false);
      return;
    }

    const empId = (employeeResult.data as any).id;
    setEmployeeId(empId);

    // الحصول على السيارة المرتبطة بالمندوب
    // نحتاج دالة للحصول على السيارة بناءً على representative_id
    // سنستخدم getAllVehicles ونفلتر
    const { getAllVehicles } = await import('@/app/actions/vehicle-actions');
    const vehiclesResult = await getAllVehicles();

    if (vehiclesResult.data) {
      const myVehicle = vehiclesResult.data.find((v: any) => v.representative_id === empId);
      if (myVehicle) {
        setVehicle(myVehicle);
        setDriverId(myVehicle.driver_id);

        // تحميل الرحلات
        const tripsResult = await getTrips(myVehicle.id);
        if (tripsResult.data) {
          setTrips(tripsResult.data);
        }
      } else {
        toast.error('لا توجد سيارة مرتبطة بك');
      }
    }

    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTripForm((prev) => ({ ...prev, items_photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createTrip({
      vehicle_id: vehicle.id,
      driver_id: driverId,
      representative_id: employeeId,
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
      setShowAddForm(false);
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

  const handleStatusUpdate = async (
    tripId: string,
    status: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
  ) => {
    setLoading(true);

    const now = new Date().toISOString();
    const result = await updateTripStatus(
      tripId,
      status,
      status === 'in_progress' ? now : undefined,
      status === 'delivered' ? now : undefined
    );

    if (result.error) {
      toast.error('حدث خطأ أثناء تحديث حالة الرحلة');
    } else {
      toast.success('تم تحديث حالة الرحلة بنجاح!');
      loadData();
    }

    setLoading(false);
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
        <p className="text-xl text-gray-600">لا توجد سيارة مرتبطة بك</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold mb-4">سجل الرحلات - {vehicle.vehicle_number}</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? 'إلغاء' : '+ إضافة رحلة'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">إضافة رحلة جديدة</h2>
          <form onSubmit={handleTripSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم العميل *</label>
              <input
                type="text"
                required
                value={tripForm.client_name}
                onChange={(e) => setTripForm({ ...tripForm, client_name: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نقطة الاستلام (من) *</label>
              <input
                type="text"
                required
                value={tripForm.pickup_location}
                onChange={(e) =>
                  setTripForm({ ...tripForm, pickup_location: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نقطة التسليم (إلى) *</label>
              <input
                type="text"
                required
                value={tripForm.delivery_location}
                onChange={(e) =>
                  setTripForm({ ...tripForm, delivery_location: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                وصف الأجهزة/البضائع (اختياري)
              </label>
              <textarea
                value={tripForm.items_description}
                onChange={(e) =>
                  setTripForm({ ...tripForm, items_description: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                صورة الأجهزة (اختياري)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded-lg"
              />
              {tripForm.items_photo_url && (
                <img
                  src={tripForm.items_photo_url}
                  alt="Items"
                  className="mt-2 w-full h-48 object-cover rounded"
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">الرحلات</h2>
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{trip.client_name}</p>
                  <p className="text-gray-600">من: {trip.pickup_location}</p>
                  <p className="text-gray-600">إلى: {trip.delivery_location}</p>
                  {trip.items_description && (
                    <p className="text-gray-600 mt-2">الأجهزة: {trip.items_description}</p>
                  )}
                  {trip.pickup_time && (
                    <p className="text-sm text-gray-500 mt-2">
                      وقت الاستلام: {new Date(trip.pickup_time).toLocaleString('ar-EG')}
                    </p>
                  )}
                  {trip.delivery_time && (
                    <p className="text-sm text-gray-500">
                      وقت التسليم: {new Date(trip.delivery_time).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    trip.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : trip.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : trip.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {trip.status === 'delivered'
                    ? 'تم التسليم'
                    : trip.status === 'in_progress'
                    ? 'قيد التوصيل'
                    : trip.status === 'cancelled'
                    ? 'ملغاة'
                    : 'قيد الانتظار'}
                </span>
              </div>

              {trip.items_photo_url && (
                <img
                  src={trip.items_photo_url}
                  alt="Items"
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}

              {trip.status !== 'delivered' && trip.status !== 'cancelled' && (
                <div className="flex gap-2">
                  {trip.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(trip.id, 'in_progress')}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      بدء التوصيل
                    </button>
                  )}
                  {trip.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate(trip.id, 'delivered')}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      تم التسليم
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(trip.id, 'cancelled')}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          ))}

          {trips.length === 0 && (
            <p className="text-center text-gray-500 py-8">لا توجد رحلات</p>
          )}
        </div>
      </div>
    </div>
  );
}
