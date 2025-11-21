import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { serverGetLoggedInUser } from "@/utils/server/serverGetLoggedInUser";
import { redirect } from "next/navigation";
import { getDefaultDashboardPath } from "@/utils/role-redirect";
import { Building2, Users, Wrench, Phone, Car, ClipboardCheck } from "lucide-react";
import { Link } from "@/components/intl-link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await serverGetLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role from app_metadata
  const userRole = user.app_metadata?.role as string | null;
  const userName = user.user_metadata?.full_name || user.email;

  // If user has a specific role, redirect to their dashboard
  if (userRole && userRole !== "user") {
    const roleDashboard = getDefaultDashboardPath(userRole);
    if (roleDashboard !== "/dashboard") {
      redirect(roleDashboard);
    }
  }

  // Quick access cards for different sections
  const quickAccessCards = [
    {
      title: "الإدارة",
      description: "لوحة تحكم الإدارة",
      icon: Building2,
      href: "/app_admin",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "الموظفين",
      description: "إدارة الموظفين والحضور",
      icon: Users,
      href: "/employee/profile",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "الصيانة",
      description: "طلبات الصيانة والفنيين",
      icon: Wrench,
      href: "/employee/profile",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "كول سنتر",
      description: "إدارة المكالمات والعملاء",
      icon: Phone,
      href: "/employee/call-center",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "السائقين",
      description: "إدارة السائقين والمركبات",
      icon: Car,
      href: "/driver/my-vehicle",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "مراقبة الجودة",
      description: "متابعة جودة الخدمة",
      icon: ClipboardCheck,
      href: "/quality-control/calls",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          مرحبًا، {userName}
        </h1>
        <p className="text-muted-foreground">
          اختر القسم الذي تريد الوصول إليه
        </p>
      </div>

      {/* Quick Access Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickAccessCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">البريد الإلكتروني:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          {userRole && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الدور:</span>
              <span className="font-medium">{userRole}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">حالة الحساب:</span>
            <span className="font-medium text-green-600">نشط</span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Panel Link */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">لوحة الإدارة</CardTitle>
          <CardDescription>
            الوصول إلى إعدادات النظام ولوحة تحكم المدير
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/app_admin">
              الذهاب إلى لوحة الإدارة
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
