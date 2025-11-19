import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { ReportsClient } from "./ReportsClient";

interface Vehicle {
  id: string;
  vehicle_number: string;
}

async function getVehicles(): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabaseAdminClient
      .from("vehicles")
      .select("id, vehicle_number")
      .order("vehicle_number");

    if (error) {
      console.error("Error loading vehicles:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error loading vehicles:", error);
    return [];
  }
}

export default async function VehicleReportsPage() {
  const vehicles = await getVehicles();

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <CardTitle>تقارير السيارات</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ReportsClient vehicles={vehicles} />
        </CardContent>
      </Card>
    </div>
  );
}
