'use server';

import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';
const supabaseAdmin = supabaseAdminClient as any;

// ==================== السيارات ====================

// إضافة سيارة جديدة
export async function createVehicle(data: {
  vehicle_number: string;
  chassis_number: string;
  license_issue_date?: string;
  license_renewal_date?: string;
  license_photo_url?: string;
  front_photo_url?: string;
  back_photo_url?: string;
  right_photo_url?: string;
  left_photo_url?: string;
  driver_id?: string;
  representative_id?: string;
}) {
  try {
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: vehicle, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على جميع السيارات
export async function getAllVehicles() {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        driver:driver_id(id, full_name, phone),
        representative:representative_id(id, full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على سيارة محددة
export async function getVehicleById(vehicleId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        driver:driver_id(id, full_name, phone),
        representative:representative_id(id, full_name, phone)
      `)
      .eq('id', vehicleId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// تحديث بيانات السيارة
export async function updateVehicle(vehicleId: string, data: any) {
  try {
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update(data)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: vehicle, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على سيارة السائق
export async function getDriverVehicle(driverId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// ==================== قراءة العداد ====================

// إضافة قراءة عداد
export async function addOdometerReading(data: {
  vehicle_id: string;
  driver_id: string;
  reading_type: 'start' | 'end';
  reading_value: number;
  photo_url?: string;
}) {
  try {
    const { data: reading, error } = await supabaseAdmin
      .from('vehicle_odometer_readings')
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: reading, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على قراءات العداد لسيارة
export async function getOdometerReadings(vehicleId: string, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicle_odometer_readings')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('reading_date', { ascending: false })
      .order('reading_time', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على آخر قراءة عداد
export async function getLatestOdometerReading(vehicleId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicle_odometer_readings')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('reading_date', { ascending: false })
      .order('reading_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// ==================== التموين ====================

// إضافة تموين
export async function addFueling(data: {
  vehicle_id: string;
  driver_id: string;
  amount_paid: number;
  liters: number;
  odometer_reading?: number;
  photo_url?: string;
}) {
  try {
    const { data: fueling, error } = await supabaseAdmin
      .from('vehicle_fueling')
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: fueling, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على سجل التموين
export async function getFuelingRecords(vehicleId: string, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicle_fueling')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('fueling_date', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// ==================== الصيانة ====================

// إضافة صيانة
export async function addMaintenance(data: {
  vehicle_id: string;
  driver_id: string;
  maintenance_type: 'oil_change' | 'brake_pads' | 'tires' | 'other';
  description?: string;
  amount_paid: number;
  odometer_reading: number;
  next_maintenance_km?: number;
}) {
  try {
    const { data: maintenance, error } = await supabaseAdmin
      .from('vehicle_maintenance')
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: maintenance, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على سجل الصيانة
export async function getMaintenanceRecords(vehicleId: string, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('maintenance_date', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// ==================== الرحلات ====================

// إضافة رحلة
export async function createTrip(data: {
  vehicle_id: string;
  driver_id: string;
  representative_id?: string;
  client_name: string;
  pickup_location: string;
  delivery_location: string;
  items_description?: string;
  items_photo_url?: string;
}) {
  try {
    const { data: trip, error } = await supabaseAdmin
      .from('vehicle_trips')
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: trip, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// تحديث حالة الرحلة
export async function updateTripStatus(
  tripId: string,
  status: 'pending' | 'in_progress' | 'delivered' | 'cancelled',
  pickupTime?: string,
  deliveryTime?: string
) {
  try {
    const updateData: any = { status };
    if (pickupTime) updateData.pickup_time = pickupTime;
    if (deliveryTime) updateData.delivery_time = deliveryTime;

    const { data, error } = await supabaseAdmin
      .from('vehicle_trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على الرحلات
export async function getTrips(vehicleId: string, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicle_trips')
      .select(`
        *,
        driver:driver_id(full_name),
        representative:representative_id(full_name)
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// ==================== التقارير ====================

// حساب معدل استهلاك الوقود
export async function calculateFuelEfficiency(vehicleId: string, days = 30) {
  try {
    const { data, error } = await supabaseAdmin.rpc('calculate_fuel_efficiency', {
      p_vehicle_id: vehicleId,
      p_days: days,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data?.[0] || null, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// الحصول على ملخص السيارة
export async function getVehicleSummary(vehicleId: string) {
  try {
    // الحصول على بيانات السيارة
    const vehicleResult = await getVehicleById(vehicleId);
    if (vehicleResult.error) {
      return { data: null, error: vehicleResult.error };
    }

    // آخر قراءة عداد
    const odometerResult = await getLatestOdometerReading(vehicleId);

    // معدل استهلاك الوقود
    const efficiencyResult = await calculateFuelEfficiency(vehicleId);

    // عدد الرحلات النشطة
    const { count: activeTrips } = await supabaseAdmin
      .from('vehicle_trips')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .in('status', ['pending', 'in_progress']);

    return {
      data: {
        vehicle: vehicleResult.data,
        latest_odometer: odometerResult.data,
        fuel_efficiency: efficiencyResult.data,
        active_trips_count: activeTrips || 0,
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
