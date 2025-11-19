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
} from '@/app/actions/vehicle-actions';
import { getEmployeeData } from '@/app/actions/employee-extended-actions';

export default function DriverVehiclePage() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('odometer');
  const [odometerReadings, setOdometerReadings] = useState<any[]>([]);
  const [fuelingRecords, setFuelingRecords] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);

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

    const empId = employeeResult.data.id;
    setEmployeeId(empId);

    // الحصول على السيارة
    const vehicleResult = await getDriverVehicle(empId);
    if (vehicleResult.error || !vehicleResult.data) {
      toast.error('لا توجد سيارة مرتبطة بك');
      setLoading(false);
      return;
    }

    setVehicle(vehicleResult.data);

    // تحميل السجلات
    const [odometerResult, fuelingResult, maintenanceResult] = await Promise.all([
      getOdometerReadings(vehicleResult.data.id),
      getFuelingRecords(vehicleResult.data.id),
      getMaintenanceRecords(vehicleResult.data.id),
    ]);

    if (odometerResult.data) setOdometerReadings(odometerResult.data);
    if (fuelingResult.data) setFuelingRecords(fuelingResult.data);
    if (maintenanceResult.data) setMaintenanceRecords(maintenanceResult.data);

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
        <h1 className="text-3xl font-bold mb-4">سيارتي - {vehicle.vehicle_number}</h1>
        <p className="text-gray-600">رقم الشاسيه: {vehicle.chassis_number}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex gap-4 p-4">
            <button
              onClick={() => setActiveTab('odometer')}
              className={`px-4 py-2 rounded ${
                activeTab === 'odometer' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              قراءة العداد
            </button>
            <button
              onClick={() => setActiveTab('fueling')}
              className={`px-4 py-2 rounded ${
                activeTab === 'fueling' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              التموين
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded ${
                activeTab === 'maintenance' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              الصيانة
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'odometer' && (
            <div>
              <h3 className="text-xl font-bold mb-4">إضافة قراءة العداد</h3>
              <form onSubmit={handleOdometerSubmit} className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">نوع القراءة</label>
                  <select
                    value={odometerForm.reading_type}
                    onChange={(e) =>
                      setOdometerForm({
                        ...odometerForm,
                        reading_type: e.target.value as 'start' | 'end',
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="start">بداية اليوم</option>
                    <option value="end">نهاية اليوم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">قراءة العداد (كم)</label>
                  <input
                    type="number"
                    required
                    value={odometerForm.reading_value}
                    onChange={(e) =>
                      setOdometerForm({ ...odometerForm, reading_value: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">صورة العداد</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'odometer')}
                    className="w-full p-2 border rounded-lg"
                  />
                  {odometerForm.photo_url && (
                    <img
                      src={odometerForm.photo_url}
                      alt="Odometer"
                      className="mt-2 w-full h-48 object-cover rounded"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </form>

              <h3 className="text-xl font-bold mb-4">السجل</h3>
              <div className="space-y-4">
                {odometerReadings.map((reading) => (
                  <div key={reading.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">
                          {reading.reading_type === 'start' ? 'بداية اليوم' : 'نهاية اليوم'}
                        </p>
                        <p className="text-2xl font-bold">{reading.reading_value} كم</p>
                        <p className="text-sm text-gray-600">
                          {new Date(reading.reading_date).toLocaleDateString('ar-EG')} -{' '}
                          {reading.reading_time}
                        </p>
                      </div>
                      {reading.photo_url && (
                        <img
                          src={reading.photo_url}
                          alt="Odometer"
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fueling' && (
            <div>
              <h3 className="text-xl font-bold mb-4">إضافة تموين</h3>
              <form onSubmit={handleFuelingSubmit} className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">المبلغ المدفوع (جنيه)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelingForm.amount_paid}
                    onChange={(e) =>
                      setFuelingForm({ ...fuelingForm, amount_paid: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">عدد اللترات</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelingForm.liters}
                    onChange={(e) =>
                      setFuelingForm({ ...fuelingForm, liters: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">قراءة العداد (اختياري)</label>
                  <input
                    type="number"
                    value={fuelingForm.odometer_reading}
                    onChange={(e) =>
                      setFuelingForm({ ...fuelingForm, odometer_reading: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">صورة عداد الجاز</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'fueling')}
                    className="w-full p-2 border rounded-lg"
                  />
                  {fuelingForm.photo_url && (
                    <img
                      src={fuelingForm.photo_url}
                      alt="Fueling"
                      className="mt-2 w-full h-48 object-cover rounded"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </form>

              <h3 className="text-xl font-bold mb-4">السجل</h3>
              <div className="space-y-4">
                {fuelingRecords.map((fueling) => (
                  <div key={fueling.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-lg font-semibold">{fueling.liters} لتر</p>
                        <p className="text-xl font-bold text-green-600">
                          {fueling.amount_paid} جنيه
                        </p>
                        {fueling.odometer_reading && (
                          <p className="text-sm text-gray-600">
                            قراءة العداد: {fueling.odometer_reading} كم
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {new Date(fueling.fueling_date).toLocaleDateString('ar-EG')} -{' '}
                          {fueling.fueling_time}
                        </p>
                      </div>
                      {fueling.photo_url && (
                        <img
                          src={fueling.photo_url}
                          alt="Fueling"
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <h3 className="text-xl font-bold mb-4">إضافة صيانة</h3>
              <form onSubmit={handleMaintenanceSubmit} className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">نوع الصيانة</label>
                  <select
                    value={maintenanceForm.maintenance_type}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        maintenance_type: e.target.value as any,
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="oil_change">تغيير زيت</option>
                    <option value="brake_pads">تغيير تيل فرامل</option>
                    <option value="tires">تغيير إطارات</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الوصف (اختياري)</label>
                  <textarea
                    value={maintenanceForm.description}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">المبلغ المدفوع (جنيه)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={maintenanceForm.amount_paid}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, amount_paid: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">قراءة العداد (كم)</label>
                  <input
                    type="number"
                    required
                    value={maintenanceForm.odometer_reading}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        odometer_reading: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    الصيانة القادمة عند (كم) - اختياري
                  </label>
                  <input
                    type="number"
                    value={maintenanceForm.next_maintenance_km}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        next_maintenance_km: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </form>

              <h3 className="text-xl font-bold mb-4">السجل</h3>
              <div className="space-y-4">
                {maintenanceRecords.map((maintenance) => (
                  <div key={maintenance.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">
                      {maintenance.maintenance_type === 'oil_change'
                        ? 'تغيير زيت'
                        : maintenance.maintenance_type === 'brake_pads'
                        ? 'تغيير تيل فرامل'
                        : maintenance.maintenance_type === 'tires'
                        ? 'تغيير إطارات'
                        : 'أخرى'}
                    </p>
                    {maintenance.description && (
                      <p className="text-gray-600">{maintenance.description}</p>
                    )}
                    <p className="text-xl font-bold text-red-600">
                      {maintenance.amount_paid} جنيه
                    </p>
                    <p className="text-sm text-gray-600">
                      قراءة العداد: {maintenance.odometer_reading} كم
                    </p>
                    {maintenance.next_maintenance_km && (
                      <p className="text-sm text-gray-600">
                        الصيانة القادمة عند: {maintenance.next_maintenance_km} كم
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {new Date(maintenance.maintenance_date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
