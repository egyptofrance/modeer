'use client';

import { useState } from 'react';
import { getDeviceByCustomerCode, getDeviceStatusHistory } from '@/app/actions/device-actions';
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
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!customerCode.trim()) {
      toast.error('الرجاء إدخال كود العميل');
      return;
    }

    try {
      setIsSearching(true);
      const result = await getDeviceByCustomerCode({ customer_code: customerCode });
      
      if (result?.data) {
        setDevices(Array.isArray(result.data) ? result.data : []);
        if (result.data.length === 0) {
          toast.info('لا توجد أجهزة مسجلة لهذا العميل');
        } else {
          toast.success('تم العثور على الأجهزة');
        }
      } else {
        toast.error('لم يتم العثور على العميل');
        setDevices([]);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء البحث');
      setDevices([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDevice = async (device: any) => {
    setSelectedDevice(device);

    try {
      const result = await getDeviceStatusHistory({ device_id: device.id });
      if (result?.data) {
        setStatusHistory(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل تاريخ الجهاز');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>تتبع الجهاز</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="customerCode">كود العميل</Label>
              <Input
                id="customerCode"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="أدخل كود العميل"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="mt-6">
              {isSearching ? 'جاري البحث...' : 'بحث'}
            </Button>
          </div>

          {devices.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">الأجهزة المسجلة:</h3>
              {devices.map((device) => (
                <Card
                  key={device.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectDevice(device)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{device.device_type}</p>
                        <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                        <p className="text-sm">{device.problem_description}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">الحالة: {device.status}</p>
                        <p className="text-sm">التكلفة: {device.estimated_cost} جنيه</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedDevice && statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>تاريخ الجهاز</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statusHistory.map((history, index) => (
                    <div key={index} className="border-b pb-2">
                      <p className="font-semibold">{history.status}</p>
                      <p className="text-sm text-gray-600">{history.notes}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(history.created_at).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
