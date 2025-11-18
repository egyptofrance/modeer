// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { getIncentiveSettings, updateIncentiveSettings } from '@/app/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function IncentiveSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    customer_visit: 50,
    on_time_attendance: 20,
    holiday_work: 100,
    overtime_per_hour: 30,
    monthly_target: 500,
    customer_registration: 30
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getIncentiveSettings();
      if (result && result.length > 0) {
        const settingsMap: any = {};
        result.forEach((setting: any) => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value
      }));

      for (const update of updates) {
        await updateIncentiveSettings(update);
      }

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8" dir="rtl">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحوافز</CardTitle>
          <CardDescription>
            تعديل مبالغ الحوافز لجميع أنواع الموظفين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="customer_visit">
                حافز حضور العميل (جنيه)
              </Label>
              <Input
                id="customer_visit"
                type="number"
                step="0.01"
                value={settings.customer_visit}
                onChange={(e) => setSettings({ ...settings, customer_visit: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                يُمنح للموظف عندما يحضر العميل الذي سجله
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="on_time_attendance">
                حافز الحضور في الموعد (جنيه)
              </Label>
              <Input
                id="on_time_attendance"
                type="number"
                step="0.01"
                value={settings.on_time_attendance}
                onChange={(e) => setSettings({ ...settings, on_time_attendance: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                يُمنح للموظف عند الحضور في الموعد المحدد
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday_work">
                حافز العمل في الإجازة (جنيه)
              </Label>
              <Input
                id="holiday_work"
                type="number"
                step="0.01"
                value={settings.holiday_work}
                onChange={(e) => setSettings({ ...settings, holiday_work: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                يُمنح للموظف عند العمل في يوم إجازة
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtime_per_hour">
                حافز الساعات الإضافية (جنيه/ساعة)
              </Label>
              <Input
                id="overtime_per_hour"
                type="number"
                step="0.01"
                value={settings.overtime_per_hour}
                onChange={(e) => setSettings({ ...settings, overtime_per_hour: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                يُمنح للموظف عن كل ساعة عمل إضافية بعد الدوام
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_target">
                حافز الهدف الشهري (جنيه)
              </Label>
              <Input
                id="monthly_target"
                type="number"
                step="0.01"
                value={settings.monthly_target}
                onChange={(e) => setSettings({ ...settings, monthly_target: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                يُمنح لموظف الكول سنتر عند الوصول إلى 9999 عميل
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_registration">
                حافز تسجيل العميل (جنيه)
              </Label>
              <Input
                id="customer_registration"
                type="number"
                step="0.01"
                value={settings.customer_registration}
                onChange={(e) => setSettings({ ...settings, customer_registration: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                يُمنح لموظف الريسبشن عند تسجيل حضور العميل
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="ml-2 h-4 w-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
