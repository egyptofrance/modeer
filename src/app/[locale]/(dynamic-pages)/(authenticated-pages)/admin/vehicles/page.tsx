'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
} from '@/app/actions/vehicle-actions';
import { getAllActiveEmployees } from '@/app/actions/employee-extended-actions';

export default function VehiclesManagementPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    chassis_number: '',
    license_issue_date: '',
    license_renewal_date: '',
    driver_id: '',
    representative_id: '',
    license_photo_url: '',
    front_photo_url: '',
    back_photo_url: '',
    right_photo_url: '',
    left_photo_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [vehiclesResult, employeesResult] = await Promise.all([
      getAllVehicles(),
      getAllActiveEmployees(),
    ]);

    if (vehiclesResult.data) {
      setVehicles(vehiclesResult.data);
    }

    if (employeesResult.data) {
      setEmployees(employeesResult.data);
    }

    setLoading(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createVehicle(formData);

      if (result.error) {
        toast.error('حدث خطأ أثناء إضافة السيارة');
      } else {
        toast.success('تم إضافة السيارة بنجاح!');
        setShowAddForm(false);
        setFormData({
          vehicle_number: '',
          chassis_number: '',
          license_issue_date: '',
          license_renewal_date: '',
          driver_id: '',
          representative_id: '',
          license_photo_url: '',
          front_photo_url: '',
          back_photo_url: '',
          right_photo_url: '',
          left_photo_url: '',
        });
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة السيارة');
    } finally {
      setLoading(false);
    }
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة السيارات</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? 'إلغاء' : '+ إضافة سيارة'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">إضافة سيارة جديدة</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  رقم السيارة *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_number}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicle_number: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  رقم الشاسيه *
                </label>
                <input
                  type="text"
                  required
                  value={formData.chassis_number}
                  onChange={(e) =>
                    setFormData({ ...formData, chassis_number: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  تاريخ إصدار الترخيص
                </label>
                <input
                  type="date"
                  value={formData.license_issue_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      license_issue_date: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  تاريخ تجديد الترخيص
                </label>
                <input
                  type="date"
                  value={formData.license_renewal_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      license_renewal_date: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">السائق</label>
                <select
                  value={formData.driver_id}
                  onChange={(e) =>
                    setFormData({ ...formData, driver_id: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">اختر السائق</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">المندوب</label>
                <select
                  value={formData.representative_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representative_id: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">اختر المندوب</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  صورة الرخصة
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'license_photo_url')}
                  className="w-full p-2 border rounded-lg"
                />
                {formData.license_photo_url && (
                  <img
                    src={formData.license_photo_url}
                    alt="License"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  صورة الأمام
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'front_photo_url')}
                  className="w-full p-2 border rounded-lg"
                />
                {formData.front_photo_url && (
                  <img
                    src={formData.front_photo_url}
                    alt="Front"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  صورة الخلف
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'back_photo_url')}
                  className="w-full p-2 border rounded-lg"
                />
                {formData.back_photo_url && (
                  <img
                    src={formData.back_photo_url}
                    alt="Back"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  صورة الجانب الأيمن
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'right_photo_url')}
                  className="w-full p-2 border rounded-lg"
                />
                {formData.right_photo_url && (
                  <img
                    src={formData.right_photo_url}
                    alt="Right"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  صورة الجانب الأيسر
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'left_photo_url')}
                  className="w-full p-2 border rounded-lg"
                />
                {formData.left_photo_url && (
                  <img
                    src={formData.left_photo_url}
                    alt="Left"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
          >
            {vehicle.front_photo_url && (
              <img
                src={vehicle.front_photo_url}
                alt={vehicle.vehicle_number}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-xl font-bold mb-2">
              {vehicle.vehicle_number}
            </h3>
            <p className="text-gray-600 mb-1">
              رقم الشاسيه: {vehicle.chassis_number}
            </p>
            {vehicle.driver && (
              <p className="text-gray-600 mb-1">
                السائق: {vehicle.driver.full_name}
              </p>
            )}
            {vehicle.representative && (
              <p className="text-gray-600 mb-1">
                المندوب: {vehicle.representative.full_name}
              </p>
            )}
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${
                vehicle.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : vehicle.status === 'maintenance'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {vehicle.status === 'active'
                ? 'نشطة'
                : vehicle.status === 'maintenance'
                ? 'تحت الصيانة'
                : 'متوقفة'}
            </span>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">لا توجد سيارات</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            إضافة أول سيارة
          </button>
        </div>
      )}
    </div>
  );
}
