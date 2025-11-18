// @ts-nocheck
'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { z } from 'zod';

// Schema for creating device
const createDeviceSchema = z.object({
  customer_id: z.string().uuid(),
  device_type: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  problem_description: z.string().min(1),
  estimated_cost: z.number().optional(),
  notes: z.string().optional(),
});

// Schema for updating device
const updateDeviceSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['waiting', 'in_progress', 'completed', 'delivered']).optional(),
  assigned_technician_id: z.string().uuid().optional(),
  completed_date: z.string().optional(),
  delivered_date: z.string().optional(),
  actual_cost: z.number().optional(),
  notes: z.string().optional(),
});

// Create device
export const createDevice = authActionClient
  .schema(createDeviceSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('devices')
      .insert({
        customer_id: parsedInput.customer_id,
        device_type: parsedInput.device_type,
        brand: parsedInput.brand,
        model: parsedInput.model,
        serial_number: parsedInput.serial_number,
        problem_description: parsedInput.problem_description,
        estimated_cost: parsedInput.estimated_cost,
        notes: parsedInput.notes,
      })
      .select('*, customer:customers(*)')
      .single();

    if (error) {
      throw new Error('Failed to create device: ' + error.message);
    }

    return data;
  });

// Update device
export const updateDevice = authActionClient
  .schema(updateDeviceSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('devices')
      .update({
        status: parsedInput.status,
        assigned_technician_id: parsedInput.assigned_technician_id,
        completed_date: parsedInput.completed_date,
        delivered_date: parsedInput.delivered_date,
        actual_cost: parsedInput.actual_cost,
        notes: parsedInput.notes,
      })
      .eq('id', parsedInput.id)
      .select('*, customer:customers(*), assigned_technician:employees(*)')
      .single();

    if (error) {
      throw new Error('Failed to update device: ' + error.message);
    }

    return data;
  });

// Get devices by customer
export const getDevicesByCustomer = authActionClient
  .schema(z.object({ customer_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('devices')
      .select('*, customer:customers(*), assigned_technician:employees(*)')
      .eq('customer_id', parsedInput.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get devices: ' + error.message);
    }

    return data;
  });

// Get devices by technician
export const getDevicesByTechnician = authActionClient
  .schema(z.object({ technician_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('devices')
      .select('*, customer:customers(*)')
      .eq('assigned_technician_id', parsedInput.technician_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get devices: ' + error.message);
    }

    return data;
  });

// Get device status history
export const getDeviceStatusHistory = authActionClient
  .schema(z.object({ device_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('device_status_history')
      .select('*, changed_by_employee:employees(*)')
      .eq('device_id', parsedInput.device_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get device status history: ' + error.message);
    }

    return data;
  });

// Get device by customer code
export const getDeviceByCustomerCode = authActionClient
  .schema(z.object({ customer_code: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    // First get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('customer_code', parsedInput.customer_code)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    // Get devices for this customer
    const { data, error } = await supabase
      .from('devices')
      .select('*, customer:customers(*), assigned_technician:employees(*)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get devices: ' + error.message);
    }

    return data;
  });
