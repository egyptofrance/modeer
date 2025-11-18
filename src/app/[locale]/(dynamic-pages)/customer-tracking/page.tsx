'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { getDeviceByCustomerCode } from '@/app/actions/device-actions';
import { getDeviceStatusHistory } from '@/app/actions/device-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CustomerTracking() {
  const [customerCode, setCustomerCode] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  const { execute: executeGetDevices, isExecuting: isSearching } =
    useAction(getDeviceByCustomerCode);
  const { execute: executeGetHistory } = useAction(getDeviceStatusHistory);

  const handleSearch = async () => {
    if (!customerCode.trim()) {
      toast.error('الرجاء إدخال كود العميل');
      return;
    }

    const result = await executeGetDevices({ customer_code: customerCode });
    if (result?.data?.success) {
      setDevices(result.data.data);
      if (result.data.data.length === 0) {
        toast.info('لا توجد أجهزة مسجلة لهذا العميل');
      } else {
        toast.success('تم العثور على الأجهزة');
      }
    } else {
      toast.error('لم يتم العثور على العميل');
      setDevices([]);
    }
  };

  const handleSelectDevice = async (device: any) => {
    setSelectedDevice(device);

    const result = await executeGetHistory({ device_id: device.id });
    if (result?.data?.success) {
      setStatusHistory(result.data.data);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: any = {
      waiting: 'في الانتظار',
      in_progress: 'قيد الصيانة',
      completed: 'تم الإصلاح',
      delivered: 'تم التسليم',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      waiting: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">تتبع الجهاز</h1>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث بكود العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="customer_code">كود العميل</Label>
              <Input
                id="customer_code"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="مثال: 101-0001"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'جاري البحث...' : 'بحث'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الأجهزة المسجلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDevice?.id === device.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectDevice(device)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {device.device_type}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {device.brand} {device.model}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {device.problem_description}
                      </p>
                    </div>
                    <div className="text-left">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          device.status
                        )}`}
                      >
                        {getStatusText(device.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        تاريخ الاستلام:{' '}
                        {new Date(device.received_date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Details */}
      {selectedDevice && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الجهاز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">نوع الجهاز</p>
                  <p className="font-semibold">{selectedDevice.device_type}</p>
                </div>
                {selectedDevice.brand && (
                  <div>
                    <p className="text-sm text-gray-500">الماركة</p>
                    <p className="font-semibold">{selectedDevice.brand}</p>
                  </div>
                )}
                {selectedDevice.model && (
                  <div>
                    <p className="text-sm text-gray-500">الموديل</p>
                    <p className="font-semibold">{selectedDevice.model}</p>
                  </div>
                )}
                {selectedDevice.serial_number && (
                  <div>
                    <p className="text-sm text-gray-500">الرقم التسلسلي</p>
                    <p className="font-mono text-sm">
                      {selectedDevice.serial_number}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">وصف المشكلة</p>
                  <p className="text-sm">{selectedDevice.problem_description}</p>
                </div>
                {selectedDevice.estimated_cost && (
                  <div>
                    <p className="text-sm text-gray-500">التكلفة المتوقعة</p>
                    <p className="font-semibold">
                      {selectedDevice.estimated_cost} جنيه
                    </p>
                  </div>
                )}
                {selectedDevice.actual_cost && (
                  <div>
                    <p className="text-sm text-gray-500">التكلفة الفعلية</p>
                    <p className="font-semibold text-green-600">
                      {selectedDevice.actual_cost} جنيه
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تاريخ الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusHistory.length === 0 ? (
                  <p className="text-gray-500">لا يوجد تاريخ للحالة</p>
                ) : (
                  statusHistory.map((history, index) => (
                    <div
                      key={history.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {statusHistory.length - index}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {getStatusText(history.status)}
                            </p>
                            {history.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {history.notes}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(
                              history.status
                            )}`}
                          >
                            {getStatusText(history.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(history.created_at).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      {devices.length === 0 && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>كيفية الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>أدخل كود العميل الذي حصلت عليه من موظف الكول سنتر</li>
              <li>اضغط على زر "بحث" أو اضغط Enter</li>
              <li>سيظهر لك جميع الأجهزة المسجلة باسمك</li>
              <li>اضغط على أي جهاز لعرض تفاصيله وتاريخ حالته</li>
              <li>يمكنك متابعة حالة جهازك في أي وقت</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
