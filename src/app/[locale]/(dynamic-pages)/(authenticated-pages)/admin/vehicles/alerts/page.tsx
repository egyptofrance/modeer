import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { AlertsClient } from "./AlertsClient";

interface Alert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_read: boolean | null;
  created_at: string | null;
  vehicles: {
    vehicle_number: string;
  } | null;
}

async function getAlerts(): Promise<Alert[]> {
  try {
    const { data, error } = await supabaseAdminClient
      .from("vehicle_alerts")
      .select(`
        id,
        vehicle_id,
        alert_type,
        severity,
        message,
        is_read,
        created_at,
        vehicles (
          vehicle_number
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading alerts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error loading alerts:", error);
    return [];
  }
}

export default async function VehicleAlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              <CardTitle>تنبيهات السيارات</CardTitle>
            </div>
            <Badge variant="secondary">
              {alerts.length} تنبيه
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AlertsClient initialAlerts={alerts} />
        </CardContent>
      </Card>
    </div>
  );
}
