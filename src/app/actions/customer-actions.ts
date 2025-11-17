'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { z } from 'zod';

// Schema for creating customer
const createCustomerSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  assigned_by_employee_id: z.string().uuid(),
  notes: z.string().optional(),
});

// Schema for registering customer visit
const registerCustomerVisitSchema = z.object({
  customer_code: z.string().min(1),
  registered_by_employee_id: z.string().uuid(),
});

// Schema for updating customer
const updateCustomerSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Create customer
export const createCustomer = authActionClient
  .schema(createCustomerSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    // Generate customer code
    const { data: codeData, error: codeError } = await supabase.rpc(
      'generate_customer_code',
      { p_employee_id: parsedInput.assigned_by_employee_id }
    );

    if (codeError) {
      throw new Error('Failed to generate customer code: ' + codeError.message);
    }

    // Create customer
    const { data, error } = await supabase
      .from('customers')
      .insert({
        customer_code: codeData,
        full_name: parsedInput.full_name,
        phone: parsedInput.phone,
        email: parsedInput.email,
        address: parsedInput.address,
        assigned_by_employee_id: parsedInput.assigned_by_employee_id,
        notes: parsedInput.notes,
      })
      .select('*, assigned_by_employee:employees!assigned_by_employee_id(*)')
      .single();

    if (error) {
      throw new Error('Failed to create customer: ' + error.message);
    }

    return { success: true, data };
  });

// Register customer visit
export const registerCustomerVisit = authActionClient
  .schema(registerCustomerVisitSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    // Get customer by code
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_code', parsedInput.customer_code)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found with code: ' + parsedInput.customer_code);
    }

    if (customer.has_visited) {
      throw new Error('Customer has already visited');
    }

    // Update customer to mark as visited
    const { data, error } = await supabase
      .from('customers')
      .update({
        has_visited: true,
        registered_by_employee_id: parsedInput.registered_by_employee_id,
        visit_date: new Date().toISOString(),
      })
      .eq('id', customer.id)
      .select('*, assigned_by_employee:employees!assigned_by_employee_id(*), registered_by_employee:employees!registered_by_employee_id(*)')
      .single();

    if (error) {
      throw new Error('Failed to register customer visit: ' + error.message);
    }

    return { success: true, data };
  });

// Update customer
export const updateCustomer = authActionClient
  .schema(updateCustomerSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('customers')
      .update({
        full_name: parsedInput.full_name,
        phone: parsedInput.phone,
        email: parsedInput.email,
        address: parsedInput.address,
        notes: parsedInput.notes,
      })
      .eq('id', parsedInput.id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update customer: ' + error.message);
    }

    return { success: true, data };
  });

// Get customer by code
export const getCustomerByCode = authActionClient
  .schema(z.object({ customer_code: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*, assigned_by_employee:employees!assigned_by_employee_id(*), registered_by_employee:employees!registered_by_employee_id(*)')
      .eq('customer_code', parsedInput.customer_code)
      .single();

    if (error) {
      throw new Error('Customer not found: ' + error.message);
    }

    return { success: true, data };
  });

// Get customers by employee
export const getCustomersByEmployee = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*, assigned_by_employee:employees!assigned_by_employee_id(*)')
      .eq('assigned_by_employee_id', parsedInput.employee_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get customers: ' + error.message);
    }

    return { success: true, data };
  });

// Get recent customers
export const getRecentCustomers = authActionClient
  .schema(z.object({ limit: z.number().default(10) }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*, assigned_by_employee:employees!assigned_by_employee_id(*), registered_by_employee:employees!registered_by_employee_id(*)')
      .order('created_at', { ascending: false })
      .limit(parsedInput.limit);

    if (error) {
      throw new Error('Failed to get recent customers: ' + error.message);
    }

    return { success: true, data };
  });

// Check monthly milestone
export const checkMonthlyMilestone = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase.rpc('check_monthly_milestone', {
      p_employee_id: parsedInput.employee_id,
    });

    if (error) {
      throw new Error('Failed to check monthly milestone: ' + error.message);
    }

    return { success: true, data };
  });
