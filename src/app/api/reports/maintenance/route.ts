import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, days } = await request.json();

    if (!vehicleId || !days) {
      return NextResponse.json(
        { error: "Vehicle ID and days are required" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdminClient
      .from("vehicle_maintenance")
      .select("amount_paid")
      .eq("vehicle_id", vehicleId)
      .gte("maintenance_date", startDate.toISOString().split("T")[0]);

    if (error) {
      console.error("Error loading maintenance:", error);
      return NextResponse.json(
        { error: "Failed to load maintenance" },
        { status: 500 }
      );
    }

    const total = data?.reduce((sum, m) => {
      const amount = typeof m.amount_paid === "string" 
        ? parseFloat(m.amount_paid) 
        : m.amount_paid;
      return sum + amount;
    }, 0) || 0;

    return NextResponse.json({ total });
  } catch (error) {
    console.error("Error in maintenance API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
