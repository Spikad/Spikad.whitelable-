-- Create a table to log webhook events for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    event_type text,
    payload jsonb,
    status text,
    error_message text
);

-- Allow public access for now (or service role)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for service role" ON webhook_logs
    FOR INSERT 
    TO service_role 
    WITH CHECK (true);

CREATE POLICY "Enable select for service role" ON webhook_logs
    FOR SELECT 
    TO service_role 
    USING (true);
