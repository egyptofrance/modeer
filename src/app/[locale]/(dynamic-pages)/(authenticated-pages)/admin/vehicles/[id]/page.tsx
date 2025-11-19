'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getVehicleSummary,
  getOdometerReadings,
  getFuelingRecords,
  getMaintenanceRecords,
  getTrips,
} from '@/app/actions/vehicle-actions';

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [summary, setSummary] = useState<any>(null);
  const [odometerReadings, setOdometerReadings] = useState<any[]>([]);
  const [fuelingRecords, setFuelingRecords] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    setLoading(true);

    const [summaryResult, odometerResult, fuelingResult, maintenanceResult, tripsResult] =
      await Promise.all([
        getVehicleSummary(vehicleId),
        getOdometerReadings(vehicleId),
        getFuelingRecords(vehicleId),
        getMaintenanceRecords(vehicleId),
        getTrips(vehicleId),
      ]);

    if (summaryResult.data) setSummary(summaryResult.data);
    if (odometerResult.data) setOdometerReadings(odometerResult.data);
    if (fuelingResult.data) setFuelingRecords(fuelingResult.data);
    if (maintenanceResult.data) setMaintenanceRecords(maintenanceResult.data);
    if (tripsResult.data) setTrips(tripsResult.data);

    setLoading(false);
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const vehicle = summary.vehicle;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← العودة
      </button>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{vehicle.vehicle_number}</h1>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">رقم الشاسيه:</span>{' '}
                {vehicle.chassis_number}
              </p>
              {vehicle.driver && (
                <p>
                  <span className="font-semibold">السائق:</span>{' '}
                  {vehicle.driver.full_name}
                </p>
              )}
              {vehicle.representative && (
                <p>
                  <span className="font-semibold">المندوب:</span>{' '}
                  {vehicle.representative.full_name}
                </p>
              )}
              {vehicle.license_issue_date && (
                <p>
                  <span className="font-semibold">تاريخ إصدار الترخيص:</span>{' '}
                  {new Date(vehicle.license_issue_date).toLocaleDateString('ar-EG')}
                </p>
              )}
              {vehicle.license_renewal_date && (
                <p>
                  <span className="font-semibold">تاريخ تجديد الترخيص:</span>{' '}
                  {new Date(vehicle.license_renewal_date).toLocaleDateString('ar-EG')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {vehicle.front_photo_url && (
              <img
                src={vehicle.front_photo_url}
                alt="Front"
                className="w-full h-32 object-cover rounded"
              />
            )}
            {vehicle.back_photo_url && (
              <img
                src={vehicle.back_photo_url}
                alt="Back"
                className="w-full h-32 object-cover rounded"
              />
            )}
            {vehicle.right_photo_url && (
              <img
                src={vehicle.right_photo_url}
                alt="Right"
                className="w-full h-32 object-cover rounded"
              />
            )}
            {vehicle.left_photo_url && (
              <img
                src={vehicle.left_photo_url}
                alt="Left"
                className="w-full h-32 object-cover rounded"
              />
            )}
          </div>
        </div>

        {summary.fuel_efficiency && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">معدل الاستهلاك</p>
              <p className="text-2xl font-bold">
                {summary.fuel_efficiency.avg_km_per_liter} كم/لتر
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">المسافة المقطوعة</p>
              <p className="text-2xl font-bold">
                {summary.fuel_efficiency.total_distance} كم
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">إجمالي الوقود</p>
              <p className="text-2xl font-bold">
                {summary.fuel_efficiency.total_liters} لتر
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">إجمالي التكلفة</p>
              <p className="text-2xl font-bold">
                {summary.fuel_efficiency.total_cost} جنيه
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex gap-4 p-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              الملخص
            </button>
            <button
              onClick={() => setActiveTab('odometer')}
              className={`px-4 py-2 rounded ${
                activeTab === 'odometer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              قراءة العداد
            </button>
            <button
              onClick={() => setActiveTab('fueling')}
              className={`px-4 py-2 rounded ${
                activeTab === 'fueling'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              التموين
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded ${
                activeTab === 'maintenance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              الصيانة
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-2 rounded ${
                activeTab === 'trips'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              الرحلات
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'odometer' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">قراءات العداد</h3>
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
          )}

          {activeTab === 'fueling' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">سجل التموين</h3>
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
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">سجل الصيانة</h3>
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
          )}

          {activeTab === 'trips' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">سجل الرحلات</h3>
              {trips.map((trip) => (
                <div key={trip.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{trip.client_name}</p>
                      <p className="text-gray-600">
                        من: {trip.pickup_location}
                      </p>
                      <p className="text-gray-600">
                        إلى: {trip.delivery_location}
                      </p>
                      {trip.items_description && (
                        <p className="text-gray-600 mt-2">
                          الأجهزة: {trip.items_description}
                        </p>
                      )}
                      {trip.pickup_time && (
                        <p className="text-sm text-gray-500 mt-2">
                          وقت الاستلام:{' '}
                          {new Date(trip.pickup_time).toLocaleString('ar-EG')}
                        </p>
                      )}
                      {trip.delivery_time && (
                        <p className="text-sm text-gray-500">
                          وقت التسليم:{' '}
                          {new Date(trip.delivery_time).toLocaleString('ar-EG')}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
