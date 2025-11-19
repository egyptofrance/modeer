"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Fuel, Wrench, DollarSign, BarChart3 } from "lucide-react";
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

interface ReportsClientProps {
  vehicles: Vehicle[];
}

export function ReportsClient({ vehicles }: ReportsClientProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [period, setPeriod] = useState<number>(30);
  const [fuelData, setFuelData] = useState<FuelEfficiency | null>(null);
  const [maintenanceTotal, setMaintenanceTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0].id);
    }
  }, [vehicles, selectedVehicle]);

  useEffect(() => {
    if (selectedVehicle) {
      loadReports();
    }
  }, [selectedVehicle, period]);

  const loadReports = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    try {
      // Load fuel efficiency
      const fuelResponse = await fetch("/api/reports/fuel-efficiency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: selectedVehicle, days: period }),
      });

      if (fuelResponse.ok) {
        const fuelResult = await fuelResponse.json();
        setFuelData(fuelResult);
      }

      // Load maintenance costs
      const maintenanceResponse = await fetch("/api/reports/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: selectedVehicle, days: period }),
      });

      if (maintenanceResponse.ok) {
        const maintenanceResult = await maintenanceResponse.json();
        setMaintenanceTotal(maintenanceResult.total);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("فشل تحميل التقارير");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد سيارات
        </div>
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
    </>
  );
}
