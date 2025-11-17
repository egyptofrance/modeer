-- Function to handle customer visit and add incentives
CREATE OR REPLACE FUNCTION handle_customer_visit()
RETURNS TRIGGER AS $$
DECLARE
    v_call_center_employee_id UUID;
    v_reception_employee_id UUID;
BEGIN
    -- Only process when has_visited changes from false to true
    IF (TG_OP = 'UPDATE' AND OLD.has_visited = false AND NEW.has_visited = true) THEN
        
        -- Get the call center employee who assigned the customer
        v_call_center_employee_id := NEW.assigned_by_employee_id;
        
        -- Get the reception employee who registered the customer
        v_reception_employee_id := NEW.registered_by_employee_id;
        
        -- Add incentive for call center employee (customer visit)
        IF v_call_center_employee_id IS NOT NULL THEN
            PERFORM add_incentive(
                v_call_center_employee_id,
                'customer_visit'::incentive_type,
                NEW.id,
                'حضور العميل: ' || NEW.full_name
            );
        END IF;
        
        -- Add incentive for reception employee (customer registration)
        IF v_reception_employee_id IS NOT NULL THEN
            PERFORM add_incentive(
                v_reception_employee_id,
                'customer_registration'::incentive_type,
                NEW.id,
                'تسجيل العميل: ' || NEW.full_name
            );
        END IF;
        
        -- Update visit date
        NEW.visit_date := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for customer visit
CREATE TRIGGER trigger_customer_visit_incentive
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION handle_customer_visit();

-- Function to check monthly milestone for call center employees
CREATE OR REPLACE FUNCTION check_monthly_milestone(p_employee_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_customers INTEGER;
    v_visited_customers INTEGER;
    v_visit_percentage DECIMAL(5, 2);
    v_milestone_reached BOOLEAN := false;
    v_employee_code TEXT;
BEGIN
    -- Get employee code
    SELECT employee_code INTO v_employee_code
    FROM public.employees
    WHERE id = p_employee_id;
    
    -- Count total customers assigned by this employee
    SELECT COUNT(*) INTO v_total_customers
    FROM public.customers
    WHERE assigned_by_employee_id = p_employee_id;
    
    -- Count visited customers
    SELECT COUNT(*) INTO v_visited_customers
    FROM public.customers
    WHERE assigned_by_employee_id = p_employee_id
    AND has_visited = true;
    
    -- Check if reached 9999 customers
    IF v_total_customers >= 9999 THEN
        -- Calculate visit percentage
        v_visit_percentage := (v_visited_customers::DECIMAL / v_total_customers::DECIMAL) * 100;
        
        -- Check if at least 50% visited
        IF v_visit_percentage >= 50 THEN
            -- Check if milestone incentive not already given
            IF NOT EXISTS(
                SELECT 1 FROM public.incentives
                WHERE employee_id = p_employee_id
                AND incentive_type = 'monthly_milestone'::incentive_type
                AND description LIKE '%9999%'
            ) THEN
                -- Add monthly milestone incentive
                PERFORM add_incentive(
                    p_employee_id,
                    'monthly_milestone'::incentive_type,
                    NULL,
                    'إكمال 9999 عميل بنسبة حضور ' || ROUND(v_visit_percentage, 2) || '%'
                );
                
                v_milestone_reached := true;
            END IF;
        END IF;
    END IF;
    
    RETURN v_milestone_reached;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee statistics
CREATE OR REPLACE FUNCTION get_employee_statistics(p_employee_id UUID)
RETURNS TABLE (
    total_customers INTEGER,
    visited_customers INTEGER,
    visit_percentage DECIMAL(5, 2),
    total_incentives DECIMAL(10, 2),
    unpaid_incentives DECIMAL(10, 2),
    today_incentives DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.customers WHERE assigned_by_employee_id = p_employee_id),
        (SELECT COUNT(*)::INTEGER FROM public.customers WHERE assigned_by_employee_id = p_employee_id AND has_visited = true),
        CASE 
            WHEN (SELECT COUNT(*) FROM public.customers WHERE assigned_by_employee_id = p_employee_id) > 0 
            THEN ((SELECT COUNT(*)::DECIMAL FROM public.customers WHERE assigned_by_employee_id = p_employee_id AND has_visited = true) / 
                  (SELECT COUNT(*)::DECIMAL FROM public.customers WHERE assigned_by_employee_id = p_employee_id) * 100)
            ELSE 0
        END,
        (SELECT COALESCE(SUM(amount), 0) FROM public.incentives WHERE employee_id = p_employee_id),
        (SELECT COALESCE(SUM(amount), 0) FROM public.incentives WHERE employee_id = p_employee_id AND is_paid = false),
        (SELECT COALESCE(SUM(amount), 0) FROM public.incentives WHERE employee_id = p_employee_id AND date = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;
