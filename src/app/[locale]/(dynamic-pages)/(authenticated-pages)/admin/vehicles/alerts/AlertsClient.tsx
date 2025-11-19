"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
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
  } | null;
}

interface AlertsClientProps {
  initialAlerts: Alert[];
}

export function AlertsClient({ initialAlerts }: AlertsClientProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const filteredAlerts = filter === "all" 
    ? alerts 
    : alerts.filter(a => !a.is_read);

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch("/api/alerts/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));

      toast.success("تم تحديد التنبيه كمقروء");
    } catch (error) {
      console.error("Error marking alert as read:", error);
      toast.error("فشل تحديث التنبيه");
    }
  };

  const runCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/alerts/check", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to run check");

      const data = await response.json();
      toast.success(`تم إنشاء ${data.count} تنبيه جديد`);
      
      // Reload page to show new alerts
      window.location.reload();
    } catch (error) {
      console.error("Error running check:", error);
      toast.error("فشل تشغيل الفحص");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return variants[severity] || "default";
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          الكل ({alerts.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          غير المقروءة ({alerts.filter(a => !a.is_read).length})
        </Button>
        <Button
          onClick={runCheck}
          disabled={loading}
          className="mr-auto"
        >
          {loading ? "جاري الفحص..." : "تشغيل فحص التنبيهات"}
        </Button>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد تنبيهات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={!alert.is_read ? "border-l-4 border-l-blue-500" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityBadge(alert.severity)}>
                        {alert.severity === "critical" && "حرج"}
                        {alert.severity === "high" && "عالي"}
                        {alert.severity === "medium" && "متوسط"}
                        {alert.severity === "low" && "منخفض"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {alert.vehicles?.vehicle_number || "غير معروف"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  {!alert.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
