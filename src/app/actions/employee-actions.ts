// @ts-nocheck
// @ts-nocheck
'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { z } from 'zod';

// Schema for creating employee
const createEmployeeSchema = z.object({
  employee_type_id: z.string().uuid(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  hire_date: z.string().optional(),
  base_salary: z.number().min(0).default(0),
  daily_salary: z.number().min(0).default(0),
});

// Schema for updating employee
const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  base_salary: z.number().min(0).optional(),
  daily_salary: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

// Create employee
export const createEmployee = authActionClient
  .schema(createEmployeeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseUserServerActionClient();

    // Generate employee code
    const { data: codeData, error: codeError } = await supabase.rpc(
      'generate_employee_code',
      { p_employee_type_id: parsedInput.employee_type_id }
    );

    if (codeError) {
      throw new Error('Failed to generate employee code: ' + codeError.message);
    }

    // Create employee
    const { data, error } = await supabase
      .from('employees')
      .insert({
        user_id: ctx.userId,
        employee_type_id: parsedInput.employee_type_id,
        employee_code: codeData,
        full_name: parsedInput.full_name,
        phone: parsedInput.phone,
        email: parsedInput.email,
        hire_date: parsedInput.hire_date || new Date().toISOString().split('T')[0],
        base_salary: parsedInput.base_salary,
        daily_salary: parsedInput.daily_salary,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create employee: ' + error.message);
    }

    return data;
  });

// Update employee
export const updateEmployee = authActionClient
  .schema(updateEmployeeSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('employees')
      .update({
        full_name: parsedInput.full_name,
        phone: parsedInput.phone,
        email: parsedInput.email,
        base_salary: parsedInput.base_salary,
        daily_salary: parsedInput.daily_salary,
        is_active: parsedInput.is_active,
      })
      .eq('id', parsedInput.id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update employee: ' + error.message);
    }

    return data;
  });

// Get employee by user ID
export const getEmployeeByUserId = authActionClient.action(async ({ ctx }) => {
  const supabase = await createSupabaseUserServerActionClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*, employee_type:employee_types(*)')
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    throw new Error('Failed to get employee: ' + error.message);
  }

  return data;
});

// Get employee statistics
export const getEmployeeStatistics = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase.rpc('get_employee_statistics', {
      p_employee_id: parsedInput.employee_id,
    });

    if (error) {
      throw new Error('Failed to get employee statistics: ' + error.message);
    }

    return data[0];
  });

// Get employee daily total
export const getEmployeeDailyTotal = authActionClient
  .schema(
    z.object({
      employee_id: z.string().uuid(),
      date: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase.rpc('get_employee_daily_total', {
      p_employee_id: parsedInput.employee_id,
      p_date: parsedInput.date || new Date().toISOString().split('T')[0],
    });

    if (error) {
      throw new Error('Failed to get employee daily total: ' + error.message);
    }

    return data[0];
  });

// Check in employee
export const checkInEmployee = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase.rpc('employee_check_in', {
      p_employee_id: parsedInput.employee_id,
    });

    if (error) {
      throw new Error('Failed to check in: ' + error.message);
    }

    return data;
  });

// Check out employee
export const checkOutEmployee = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase.rpc('employee_check_out', {
      p_employee_id: parsedInput.employee_id,
    });

    if (error) {
      throw new Error('Failed to check out: ' + error.message);
    }

    return data;
  });

// Get all employee types
export const getEmployeeTypes = authActionClient.action(async () => {
  const supabase = await createSupabaseUserServerActionClient();

  const { data, error } = await supabase
    .from('employee_types')
    .select('*')
    .order('name');

  if (error) {
    throw new Error('Failed to get employee types: ' + error.message);
  }

  return data;
});
