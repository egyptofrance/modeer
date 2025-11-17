export type EmployeeType = {
  id: string;
  name: string;
  code_prefix: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  user_id: string | null;
  employee_type_id: string;
  employee_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  hire_date: string;
  base_salary: number;
  daily_salary: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee_type?: EmployeeType;
};

export type Customer = {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  assigned_by_employee_id: string | null;
  registered_by_employee_id: string | null;
  has_visited: boolean;
  visit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_by_employee?: Employee;
  registered_by_employee?: Employee;
};

export type DeviceStatus = 'waiting' | 'in_progress' | 'completed' | 'delivered';

export type Device = {
  id: string;
  customer_id: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  problem_description: string;
  status: DeviceStatus;
  assigned_technician_id: string | null;
  received_date: string;
  completed_date: string | null;
  delivered_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  assigned_technician?: Employee;
};

export type IncentiveType =
  | 'customer_visit'
  | 'on_time_attendance'
  | 'holiday_work'
  | 'overtime'
  | 'monthly_milestone'
  | 'customer_registration'
  | 'other';

export type Incentive = {
  id: string;
  employee_id: string;
  incentive_type: IncentiveType;
  amount: number;
  description: string | null;
  related_customer_id: string | null;
  date: string;
  is_paid: boolean;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  related_customer?: Customer;
};

export type Attendance = {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string | null;
  is_holiday: boolean;
  overtime_hours: number;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
};

export type WorkSchedule = {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeStatistics = {
  total_customers: number;
  visited_customers: number;
  visit_percentage: number;
  total_incentives: number;
  unpaid_incentives: number;
  today_incentives: number;
};

export type DailyTotal = {
  daily_salary: number;
  daily_incentives: number;
  total: number;
};

export type IncentiveSetting = {
  id: string;
  incentive_type: IncentiveType;
  amount: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
