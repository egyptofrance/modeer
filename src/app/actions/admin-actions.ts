// @ts-nocheck
'use server';

import { createClient } from '@/lib/supabase/server';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';

// Schema for creating employee with auth
const createEmployeeWithAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  phone: z.string().min(1),
  employee_type_id: z.string().uuid(),
  base_salary: z.number().min(0),
  daily_salary: z.number().min(0),
});

// Schema for updating employee
const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  employee_type_id: z.string().uuid().optional(),
  base_salary: z.number().min(0).optional(),
  daily_salary: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

// Schema for deleting employee
const deleteEmployeeSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Check if current user is admin
 */
export const checkIsAdmin = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return !!admin;
  });

/**
 * Get current admin info
 */
export const getCurrentAdmin = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return admin;
  });

/**
 * Create employee with auth account
 */
export const createEmployeeWithAuth = authActionClient
  .schema(createEmployeeWithAuthSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      throw new Error('Not authorized');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parsedInput.email,
      password: parsedInput.password,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Generate employee code
    const { data: employeeType } = await supabase
      .from('employee_types')
      .select('id, name')
      .eq('id', parsedInput.employee_type_id)
      .single();

    if (!employeeType) throw new Error('Invalid employee type');

    // Get count of employees with this type
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('employee_type_id', parsedInput.employee_type_id);

    const sequence = String((count || 0) + 1).padStart(4, '0');
    const typeCode = parsedInput.employee_type_id.substring(0, 3);
    const employee_code = `${typeCode}-${sequence}`;

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        user_id: authData.user.id,
        employee_type_id: parsedInput.employee_type_id,
        employee_code,
        full_name: parsedInput.full_name,
        phone: parsedInput.phone,
        email: parsedInput.email,
        hire_date: new Date().toISOString().split('T')[0],
        base_salary: parsedInput.base_salary,
        daily_salary: parsedInput.daily_salary,
      })
      .select()
      .single();

    if (employeeError) {
      // Rollback: delete auth user if employee creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw employeeError;
    }

    return employee;
  });

/**
 * Get all employees
 */
export const getAllEmployees = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      throw new Error('Not authorized');
    }

    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        *,
        employee_type:employee_types(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return employees;
  });

/**
 * Update employee
 */
export const updateEmployeeAsAdmin = authActionClient
  .schema(updateEmployeeSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      throw new Error('Not authorized');
    }

    const { id, ...updates } = parsedInput;

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return employee;
  });

/**
 * Delete employee
 */
export const deleteEmployee = authActionClient
  .schema(deleteEmployeeSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      throw new Error('Not authorized');
    }

    // Get employee to get user_id
    const { data: employee } = await supabase
      .from('employees')
      .select('user_id')
      .eq('id', parsedInput.id)
      .single();

    if (!employee) throw new Error('Employee not found');

    // Delete employee (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', parsedInput.id);

    if (deleteError) throw deleteError;

    // Delete auth user
    await supabase.auth.admin.deleteUser(employee.user_id);

    return { success: true };
  });

/**
 * Get system statistics
 */
export const getSystemStatistics = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      throw new Error('Not authorized');
    }

    // Get counts
    const { count: employeesCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: devicesCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    const { count: activeDevicesCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']);

    // Get total incentives this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: incentivesData } = await supabase
      .from('incentives')
      .select('amount')
      .gte('created_at', startOfMonth.toISOString());

    const totalIncentives = incentivesData?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;

    return {
      employees_count: employeesCount || 0,
      customers_count: customersCount || 0,
      devices_count: devicesCount || 0,
      active_devices_count: activeDevicesCount || 0,
      total_incentives_this_month: totalIncentives,
    };
  });
