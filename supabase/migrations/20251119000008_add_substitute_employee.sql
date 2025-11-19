-- Add substitute employee field to leave_requests
-- Migration: 20251119000008_add_substitute_employee

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS substitute_employee_id UUID REFERENCES public.employees(id);

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS substitute_employee_name TEXT;

COMMENT ON COLUMN public.leave_requests.substitute_employee_id IS 'الموظف البديل الذي سيقوم بالعمل أثناء الإجازة';
COMMENT ON COLUMN public.leave_requests.substitute_employee_name IS 'اسم الموظف البديل';
