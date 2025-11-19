"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";
import { toast } from "sonner";

interface Alert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_read: boolean;
  created_at: string;
  vehicles: {
    vehicle_number: string;
  };
}

export default function VehicleAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      let query = supabaseAdminClient
        .from("vehicle_alerts")
        .select(`
          *,
          vehicles (
            vehicle_number
          )
        `)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts((data as any) || []);
    } catch (error: any) {
      toast.error("فشل تحميل التنبيهات: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabaseAdminClient
        .from("vehicle_alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;

      toast.success("تم تحديد التنبيه كمقروء");
      loadAlerts();
    } catch (error: any) {
      toast.error("فشل تحديث التنبيه: " + error.message);
    }
  };

  const runChecks = async () => {
    try {
      const { error } = await supabaseAdminClient.rpc("run_vehicle_alerts_check");

      if (error) throw error;

      toast.success("تم تشغيل فحص التنبيهات");
      loadAlerts();
    } catch (error: any) {
      toast.error("فشل تشغيل الفحص: " + error.message);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      license_renewal: "تجديد الترخيص",
      insurance_renewal: "تجديد التأمين",
      oil_change: "تغيير الزيت",
      brake_pads: "تغيير الفرامل",
      fuel_consumption_anomaly: "استهلاك وقود غير طبيعي",
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          تنبيهات السيارات
        </h1>
        <Button onClick={runChecks}>
          تشغيل فحص التنبيهات
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          غير المقروءة ({alerts.filter((a) => !a.is_read).length})
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          الكل ({alerts.length})
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              لا توجد تنبيهات
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={!alert.is_read ? "border-r-4 border-r-blue-500" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <CardTitle className="text-lg">
                        {(alert as any).vehicles?.vehicle_number || "غير محدد"}
                      </CardTitle>
                      <Badge className={`mt-1 ${getSeverityBadge(alert.severity)}`}>
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تحديد كمقروء
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{alert.message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(alert.created_at).toLocaleString("ar-EG")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
