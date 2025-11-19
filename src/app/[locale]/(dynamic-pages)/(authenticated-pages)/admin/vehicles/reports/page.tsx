"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Fuel, Wrench, DollarSign } from "lucide-react";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  vehicle_number: string;
}

interface FuelEfficiency {
  avg_km_per_liter: number;
  total_distance: number;
  total_liters: number;
  total_cost: number;
}

export default function VehicleReportsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [period, setPeriod] = useState<number>(30);
  const [fuelData, setFuelData] = useState<FuelEfficiency | null>(null);
  const [maintenanceTotal, setMaintenanceTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      loadReports();
    }
  }, [selectedVehicle, period]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabaseAdminClient
        .from("vehicles")
        .select("id, vehicle_number")
        .eq("status", "active")
        .order("vehicle_number");

      if (error) throw error;
      setVehicles((data as any) || []);
      if (data && data.length > 0) {
        setSelectedVehicle(data[0].id);
      }
    } catch (error: any) {
      toast.error("فشل تحميل السيارات: " + error.message);
    }
  };

  const loadReports = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    try {
      // حساب كفاءة الوقود
      const { data: fuelEfficiency, error: fuelError } = await supabaseAdminClient
        .rpc("calculate_fuel_efficiency", {
          p_vehicle_id: selectedVehicle,
          p_days: period,
        });

      if (fuelError) throw fuelError;
      if (fuelEfficiency && fuelEfficiency.length > 0) {
        setFuelData(fuelEfficiency[0]);
      }

      // حساب مصاريف الصيانة
      const { data: maintenance, error: maintenanceError } = await supabaseAdminClient
        .from("vehicle_maintenance")
        .select("amount_paid")
        .eq("vehicle_id", selectedVehicle)
        .gte("maintenance_date", new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

      if (maintenanceError) throw maintenanceError;
      const total = (maintenance as any)?.reduce((sum: number, m: any) => sum + parseFloat(m.amount_paid), 0) || 0;
      setMaintenanceTotal(total);
    } catch (error: any) {
      toast.error("فشل تحميل التقارير: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          تقارير السيارات
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">السيارة</label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="اختر السيارة" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الفترة</label>
          <Select value={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 90 يوم</SelectItem>
              <SelectItem value="365">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* معدل الاستهلاك */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الاستهلاك</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fuelData?.avg_km_per_liter?.toFixed(2) || "0"} كم/لتر
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                خلال آخر {period} يوم
              </p>
            </CardContent>
          </Card>

          {/* المسافة المقطوعة */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المسافة المقطوعة</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fuelData?.total_distance?.toLocaleString() || "0"} كم
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                خلال آخر {period} يوم
              </p>
            </CardContent>
          </Card>

          {/* مصاريف الوقود */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مصاريف الوقود</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fuelData?.total_cost?.toLocaleString() || "0"} ج.م
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {fuelData?.total_liters?.toFixed(2) || "0"} لتر
              </p>
            </CardContent>
          </Card>

          {/* مصاريف الصيانة */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مصاريف الصيانة</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {maintenanceTotal.toLocaleString()} ج.م
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                خلال آخر {period} يوم
              </p>
            </CardContent>
          </Card>

          {/* إجمالي المصاريف */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصاريف</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((fuelData?.total_cost || 0) + maintenanceTotal).toLocaleString()} ج.م
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">وقود</p>
                  <p className="font-medium">{fuelData?.total_cost?.toLocaleString() || "0"} ج.م</p>
                </div>
                <div>
                  <p className="text-muted-foreground">صيانة</p>
                  <p className="font-medium">{maintenanceTotal.toLocaleString()} ج.م</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
