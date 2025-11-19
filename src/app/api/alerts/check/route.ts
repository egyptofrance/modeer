import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";

export async function POST() {
  try {
    const { data, error } = await supabaseAdminClient
      .rpc("check_vehicle_alerts");

    if (error) {
      console.error("Error checking alerts:", error);
      return NextResponse.json(
        { error: "Failed to check alerts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: data || 0 });
  } catch (error) {
    console.error("Error in check API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
