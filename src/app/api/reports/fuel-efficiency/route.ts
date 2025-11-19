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

    const { data, error } = await supabaseAdminClient
      .rpc("calculate_fuel_efficiency", {
        p_vehicle_id: vehicleId,
        p_days: days,
      });

    if (error) {
      console.error("Error calculating fuel efficiency:", error);
      return NextResponse.json(
        { error: "Failed to calculate fuel efficiency" },
        { status: 500 }
      );
    }

    const result = data && data.length > 0 ? data[0] : {
      avg_km_per_liter: 0,
      total_distance: 0,
      total_liters: 0,
      total_cost: 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in fuel-efficiency API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
