'use server';

import { createServerClient } from '@/supabase-clients/server';

// ==================== بيانات الموظف ====================

export async function getEmployeeDailySalary(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('calculate_daily_salary', {
    p_employee_id: employeeId,
  });
  if (error) {
    console.error('Error calculating daily salary:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function checkLeaveEligibility(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('is_eligible_for_leave', {
    p_employee_id: employeeId,
  });
  if (error) {
    console.error('Error checking leave eligibility:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getEmployeeExtendedData(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employees')
    .select(
      'id, full_name, email, phone, employee_code, base_salary, daily_salary, hire_date, date_of_birth, qualification_level, qualification_name, address, gender, initial_test_score'
    )
    .eq('id', employeeId)
    .single();

  if (error) {
    console.error('Error getting employee extended data:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== المستندات ====================

export async function getEmployeeDocuments(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting employee documents:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function uploadDocument(params: {
  employeeId: string;
  documentType: string;
  filePath: string;
}) {
  const supabase = await createServerClient();

  // Check if document record exists
  const { data: existing } = await supabase
    .from('employee_documents')
    .select('id')
    .eq('employee_id', params.employeeId)
    .single();

  const updateData = {
    employee_id: params.employeeId,
    [params.documentType]: params.filePath,
  };

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('employee_documents')
      .update(updateData)
      .eq('employee_id', params.employeeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('employee_documents')
      .insert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting document:', error);
      return { data: null, error };
    }
    return { data, error: null };
  }
}

export async function checkDocumentsComplete(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('check_documents_complete', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error checking documents complete:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== الحوافز المقررة ====================

export async function getEmployeeIncentiveRules(employeeId: string) {
  const supabase = await createServerClient();

  // Get employee type
  const { data: employee } = await supabase
    .from('employees')
    .select('employee_type_id')
    .eq('id', employeeId)
    .single();

  if (!employee) {
    return { data: [], error: null };
  }

  // Get incentive rules
  const { data, error } = await supabase
    .from('incentive_rules')
    .select('*')
    .eq('employee_type_id', employee.employee_type_id)
    .eq('is_active', true)
    .order('incentive_type', { ascending: true });

  if (error) {
    console.error('Error getting incentive rules:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getTotalFixedIncentives(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_total_incentives', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting total incentives:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== التوجيهات ====================

export async function getEmployeeOrientations(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_orientations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('orientation_date', { ascending: false });

  if (error) {
    console.error('Error getting orientations:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getCompletedOrientationsCount(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_completed_orientations_count',
    { p_employee_id: employeeId }
  );

  if (error) {
    console.error('Error getting completed orientations count:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== الاختبارات ====================

export async function getEmployeeTests(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_tests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('test_date', { ascending: false });

  if (error) {
    console.error('Error getting tests:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getAverageTestScore(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_average_test_score',
    { p_employee_id: employeeId }
  );

  if (error) {
    console.error('Error getting average test score:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getTrainingReport(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_training_report', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting training report:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function submitTestAnswers(params: {
  employee_id: string;
  test_title: string;
  test_type: string;
  score_obtained: number;
  total_score: number;
  test_date: string;
  answers: any;
}) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_tests')
    .insert({
      ...params,
      status: 'مكتمل',
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting test:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== العقوبات ====================

export async function getEmployeePenalties(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .select('*')
    .eq('employee_id', employeeId)
    .order('incident_date', { ascending: false });

  if (error) {
    console.error('Error getting penalties:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function addPenaltyResponse(params: {
  penaltyId: string;
  response: string;
}) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_penalties')
    .update({ employee_response: params.response })
    .eq('id', params.penaltyId)
    .select()
    .single();

  if (error) {
    console.error('Error adding penalty response:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getPenaltiesReport(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_penalties_report', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting penalties report:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== الإجازات ====================

export async function getLeaveBalance(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_leave_balance', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting leave balance:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getLeaveRequests(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting leave requests:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function createLeaveRequest(params: {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes?: string;
}) {
  const supabase = await createServerClient();

  // Check eligibility
  const eligibilityResult = await checkLeaveEligibility(params.employee_id);
  if (!eligibilityResult.data) {
    return {
      data: null,
      error: {
        message: 'غير مؤهل للإجازات (يجب مرور 6 شهور من التعيين)',
      },
    };
  }

  // Check conflict
  const { data: conflict } = await supabase.rpc('check_leave_conflict', {
    p_employee_id: params.employee_id,
    p_start_date: params.start_date,
    p_end_date: params.end_date,
  });

  if (conflict) {
    return {
      data: null,
      error: { message: 'يوجد تعارض مع طلب إجازة آخر' },
    };
  }

  // Create request
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(params)
    .select()
    .single();

  if (error) {
    console.error('Error creating leave request:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getLeaveStats(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_leave_stats', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting leave stats:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

// ==================== التقييمات ====================

export async function getEmployeeEvaluations(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('employee_evaluations')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'معتمد')
    .order('evaluation_year', { ascending: false })
    .order('evaluation_month', { ascending: false });

  if (error) {
    console.error('Error getting evaluations:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getLatestEvaluation(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_latest_evaluation', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting latest evaluation:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getAverageEvaluation(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    'get_employee_average_evaluation',
    { p_employee_id: employeeId }
  );

  if (error) {
    console.error('Error getting average evaluation:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getEvaluationStats(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_employee_evaluation_stats', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error getting evaluation stats:', error);
    return { data: null, error };
  }
  return { data, error: null };
}
