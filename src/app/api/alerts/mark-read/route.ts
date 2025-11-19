import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminClient } from "@/supabase-clients/admin/supabaseAdminClient";

export async function POST(request: NextRequest) {
  try {
    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdminClient
      .from("vehicle_alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    if (error) {
      console.error("Error marking alert as read:", error);
      return NextResponse.json(
        { error: "Failed to mark alert as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark-read API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
