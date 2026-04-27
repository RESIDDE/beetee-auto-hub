-- Update get_customer_portal_data to include document URLs
CREATE OR REPLACE FUNCTION public.get_customer_portal_data(lookup_phone text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    found_customer RECORD;
    customer_repairs JSON;
    customer_invoices JSON;
    customer_quotes JSON;
BEGIN
    -- Find the customer
    SELECT * INTO found_customer FROM customers WHERE phone = lookup_phone LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Get repairs with vehicle info
    SELECT json_agg(r) INTO customer_repairs
    FROM (
        SELECT 
            repairs.*,
            json_build_object(
                'make', vehicles.make,
                'model', vehicles.model,
                'year', vehicles.year
            ) as vehicle
        FROM repairs
        LEFT JOIN vehicles ON repairs.vehicle_id = vehicles.id
        WHERE repairs.customer_id = found_customer.id
        ORDER BY repairs.created_at DESC
    ) r;

    -- Get invoices
    SELECT json_agg(i) INTO customer_invoices
    FROM (
        SELECT * FROM invoices 
        WHERE customer_id = found_customer.id 
        ORDER BY created_at DESC
    ) i;
    
    -- Get performance quotes
    SELECT json_agg(q) INTO customer_quotes
    FROM (
        SELECT * FROM performance_quotes 
        WHERE customer_id = found_customer.id 
        ORDER BY created_at DESC
    ) q;

    RETURN json_build_object(
        'customer', found_customer,
        'repairs', COALESCE(customer_repairs, '[]'::json),
        'invoices', COALESCE(customer_invoices, '[]'::json),
        'quotes', COALESCE(customer_quotes, '[]'::json)
    );
END;
$function$;
