// @ts-nocheck
'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';

// ==================== إدارة الموظفين ====================

export async function getAllEmployees() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      employee_types(name, code_prefix)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting employees:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getEmployeeById(employeeId: string) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      employee_types(name, code_prefix)
    `)
    .eq('id', employeeId)
    .single();

  if (error) {
    console.error('Error getting employee:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function updateEmployeeData(params: {
  employeeId: string;
  data: any;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employees')
    .update(params.data)
    .eq('id', params.employeeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating employee:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== موافقات الإجازات ====================

export async function getAllLeaveRequests() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employees(full_name, employee_code, employee_types(name))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting leave requests:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getPendingLeaveRequests() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employees(full_name, employee_code, employee_types(name))
    `)
    .eq('status', 'قيد المراجعة')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting pending requests:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function approveLeaveRequest(params: {
  requestId: string;
  reviewerId: string;
  reviewerName: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'موافق عليها',
      reviewed_by: params.reviewerId,
      reviewed_by_name: params.reviewerName,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.requestId)
    .select()
    .single();

  if (error) {
    console.error('Error approving leave request:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function rejectLeaveRequest(params: {
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  reason: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'مرفوضة',
      reviewed_by: params.reviewerId,
      reviewed_by_name: params.reviewerName,
      reviewed_at: new Date().toISOString(),
      rejection_reason: params.reason,
    })
    .eq('id', params.requestId)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting leave request:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== إدارة التقييمات ====================

export async function createEvaluation(params: {
  employee_id: string;
  evaluation_month: number;
  evaluation_year: number;
  performance_score: number;
  commitment_score: number;
  customer_service_score: number;
  teamwork_score: number;
  innovation_score: number;
  evaluator_notes?: string;
  evaluated_by: string;
  evaluated_by_name: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_evaluations')
    .insert({
      ...params,
      status: 'معتمد',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating evaluation:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function updateEvaluation(params: {
  evaluationId: string;
  data: any;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_evaluations')
    .update(params.data)
    .eq('id', params.evaluationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating evaluation:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getAllEvaluations() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_evaluations')
    .select(`
      *,
      employees(full_name, employee_code, employee_types(name))
    `)
    .order('evaluation_year', { ascending: false })
    .order('evaluation_month', { ascending: false });

  if (error) {
    console.error('Error getting evaluations:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== التوجيهات والاختبارات ====================

export async function createOrientation(params: {
  employee_id: string;
  orientation_title: string;
  orientation_description?: string;
  orientation_type: string;
  duration_hours?: number;
  orientation_date: string;
  conducted_by: string;
  conducted_by_name: string;
  notes?: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_orientations')
    .insert(params)
    .select()
    .single();

  if (error) {
    console.error('Error creating orientation:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function createTest(params: {
  employee_id: string;
  test_title: string;
  test_description?: string;
  test_type: string;
  total_score: number;
  passing_score: number;
  test_date: string;
  conducted_by: string;
  conducted_by_name: string;
  questions?: any;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_tests')
    .insert(params)
    .select()
    .single();

  if (error) {
    console.error('Error creating test:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function updateTestScore(params: {
  testId: string;
  score: number;
  notes?: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_tests')
    .update({
      score: params.score,
      notes: params.notes,
      status: 'مكتمل',
    })
    .eq('id', params.testId)
    .select()
    .single();

  if (error) {
    console.error('Error updating test score:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getAllOrientations() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_orientations')
    .select(`
      *,
      employees(full_name, employee_code, employee_types(name))
    `)
    .order('orientation_date', { ascending: false });

  if (error) {
    console.error('Error getting orientations:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getAllTests() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_tests')
    .select(`
      *,
      employees(full_name, employee_code, employee_types(name))
    `)
    .order('test_date', { ascending: false });

  if (error) {
    console.error('Error getting tests:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== إدارة العقوبات ====================

export async function createPenalty(params: {
  employee_id: string;
  penalty_type: string;
  deduction_amount: number;
  penalty_title: string;
  penalty_description?: string;
  incident_date: string;
  incident_time?: string;
  applied_by: string;
  applied_by_name: string;
  notes?: string;
  requires_approval?: boolean;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .insert({
      ...params,
      status: params.requires_approval ? 'معلقة' : 'مطبقة',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating penalty:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function approvePenalty(params: {
  penaltyId: string;
  approverId: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .update({
      status: 'مطبقة',
      approved_by: params.approverId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', params.penaltyId)
    .select()
    .single();

  if (error) {
    console.error('Error approving penalty:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function cancelPenalty(params: {
  penaltyId: string;
}) {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .update({ status: 'ملغاة' })
    .eq('id', params.penaltyId)
    .select()
    .single();

  if (error) {
    console.error('Error canceling penalty:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getAllPenalties() {
  const supabase = await createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .select(`
      *,
      employees(full_name, employee_code, employee_types(name))
    `)
    .order('incident_date', { ascending: false });

  if (error) {
    console.error('Error getting penalties:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== التقارير ====================

export async function getEmployeeFullReport(employeeId: string) {
  const supabase = await createSupabaseUserServerActionClient();
  
  // Get employee data
  const empResult = await getEmployeeById(employeeId);
  
  // Get evaluations
  const { data: evaluations } = await supabase
    .from('employee_evaluations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('evaluation_year', { ascending: false })
    .order('evaluation_month', { ascending: false });

  // Get leave requests
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  // Get penalties
  const { data: penalties } = await supabase
    .from('employee_penalties')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'مطبقة')
    .order('incident_date', { ascending: false });

  // Get orientations
  const { data: orientations } = await supabase
    .from('employee_orientations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('orientation_date', { ascending: false });

  // Get tests
  const { data: tests } = await supabase
    .from('employee_tests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('test_date', { ascending: false });

  return {
    data: {
      employee: empResult.data,
      evaluations: evaluations || [],
      leaves: leaves || [],
      penalties: penalties || [],
      orientations: orientations || [],
      tests: tests || [],
    },
    error: null,
  };
}

export async function getSystemStatistics() {
  const supabase = await createSupabaseUserServerActionClient();
  
  const { count: employeeCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });

  const { count: pendingLeaves } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'قيد المراجعة');

  const { count: pendingPenalties } = await supabase
    .from('employee_penalties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'معلقة');

  const { count: thisMonthEvaluations } = await supabase
    .from('employee_evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('evaluation_year', new Date().getFullYear())
    .eq('evaluation_month', new Date().getMonth() + 1);

  return {
    data: {
      totalEmployees: employeeCount || 0,
      pendingLeaveRequests: pendingLeaves || 0,
      pendingPenalties: pendingPenalties || 0,
      thisMonthEvaluations: thisMonthEvaluations || 0,
    },
    error: null,
  };
}


// ==================== التقارير ====================

export async function getEmployeeReport(params: { employeeId: string }) {
  const supabase = await createSupabaseUserServerActionClient();
  
  // Get employee data
  const { data: employee } = await supabase
    .from('employees')
    .select('*, employee_types(name)')
    .eq('id', params.employeeId)
    .single();

  // Get training stats
  const { data: training } = await supabase
    .rpc('get_employee_training_report', { p_employee_id: params.employeeId });

  // Get evaluation stats
  const { data: evaluations } = await supabase
    .rpc('get_employee_evaluation_stats', { p_employee_id: params.employeeId });

  // Get leave stats
  const { data: leave } = await supabase
    .rpc('get_employee_leave_stats', { p_employee_id: params.employeeId });

  // Get penalty stats
  const { data: penalties } = await supabase
    .rpc('get_employee_penalties_report', { p_employee_id: params.employeeId });

  return {
    data: {
      employee,
      training: Array.isArray(training) && training.length > 0 ? training[0] : null,
      evaluations: Array.isArray(evaluations) && evaluations.length > 0 ? evaluations[0] : null,
      leave: Array.isArray(leave) && leave.length > 0 ? leave[0] : null,
      penalties: Array.isArray(penalties) && penalties.length > 0 ? penalties[0] : null,
    },
    error: null,
  };
}

export async function getSystemStats() {
  const supabase = await createSupabaseUserServerActionClient();

  const [employees, leaveRequests, evaluations, penalties] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }),
    supabase.from('employee_evaluations').select('id', { count: 'exact', head: true }),
    supabase.from('employee_penalties').select('id', { count: 'exact', head: true }),
  ]);

  return {
    data: {
      total_employees: employees.count || 0,
      total_leave_requests: leaveRequests.count || 0,
      total_evaluations: evaluations.count || 0,
      total_penalties: penalties.count || 0,
    },
    error: null,
  };
}
