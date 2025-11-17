'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { z } from 'zod';

// Get incentives by employee
export const getIncentivesByEmployee = authActionClient
  .schema(
    z.object({
      employee_id: z.string().uuid(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    let query = supabase
      .from('incentives')
      .select('*, employee:employees(*), related_customer:customers(*)')
      .eq('employee_id', parsedInput.employee_id)
      .order('date', { ascending: false });

    if (parsedInput.start_date) {
      query = query.gte('date', parsedInput.start_date);
    }

    if (parsedInput.end_date) {
      query = query.lte('date', parsedInput.end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to get incentives: ' + error.message);
    }

    return { success: true, data };
  });

// Get today's incentives by employee
export const getTodayIncentivesByEmployee = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('incentives')
      .select('*, related_customer:customers(*)')
      .eq('employee_id', parsedInput.employee_id)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get today incentives: ' + error.message);
    }

    return { success: true, data };
  });

// Get unpaid incentives by employee
export const getUnpaidIncentivesByEmployee = authActionClient
  .schema(z.object({ employee_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('incentives')
      .select('*, related_customer:customers(*)')
      .eq('employee_id', parsedInput.employee_id)
      .eq('is_paid', false)
      .order('date', { ascending: false });

    if (error) {
      throw new Error('Failed to get unpaid incentives: ' + error.message);
    }

    return { success: true, data };
  });

// Mark incentives as paid
export const markIncentivesAsPaid = authActionClient
  .schema(
    z.object({
      incentive_ids: z.array(z.string().uuid()),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('incentives')
      .update({
        is_paid: true,
        paid_date: new Date().toISOString().split('T')[0],
      })
      .in('id', parsedInput.incentive_ids)
      .select();

    if (error) {
      throw new Error('Failed to mark incentives as paid: ' + error.message);
    }

    return { success: true, data };
  });

// Get incentive settings
export const getIncentiveSettings = authActionClient.action(async () => {
  const supabase = await createSupabaseUserServerActionClient();

  const { data, error } = await supabase
    .from('incentive_settings')
    .select('*')
    .eq('is_active', true)
    .order('incentive_type');

  if (error) {
    throw new Error('Failed to get incentive settings: ' + error.message);
  }

  return { success: true, data };
});

// Update incentive setting
export const updateIncentiveSetting = authActionClient
  .schema(
    z.object({
      incentive_type: z.enum([
        'customer_visit',
        'on_time_attendance',
        'holiday_work',
        'overtime',
        'monthly_milestone',
        'customer_registration',
        'other',
      ]),
      amount: z.number().min(0),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('incentive_settings')
      .update({
        amount: parsedInput.amount,
        description: parsedInput.description,
        is_active: parsedInput.is_active,
      })
      .eq('incentive_type', parsedInput.incentive_type)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update incentive setting: ' + error.message);
    }

    return { success: true, data };
  });

// Get incentive summary by employee
export const getIncentiveSummary = authActionClient
  .schema(
    z.object({
      employee_id: z.string().uuid(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseUserServerActionClient();

    let query = supabase
      .from('incentives')
      .select('incentive_type, amount')
      .eq('employee_id', parsedInput.employee_id);

    if (parsedInput.start_date) {
      query = query.gte('date', parsedInput.start_date);
    }

    if (parsedInput.end_date) {
      query = query.lte('date', parsedInput.end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to get incentive summary: ' + error.message);
    }

    // Group by incentive type
    const summary = data.reduce((acc: any, item: any) => {
      if (!acc[item.incentive_type]) {
        acc[item.incentive_type] = {
          type: item.incentive_type,
          count: 0,
          total: 0,
        };
      }
      acc[item.incentive_type].count += 1;
      acc[item.incentive_type].total += parseFloat(item.amount);
      return acc;
    }, {});

    return { success: true, data: Object.values(summary) };
  });
