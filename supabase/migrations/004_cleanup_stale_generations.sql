-- Function to mark stale generations as failed
CREATE OR REPLACE FUNCTION cleanup_stale_generations()
RETURNS void AS $$
BEGIN
  UPDATE generations
  SET
    status = 'error',
    error_message = 'Generation timed out',
    completed_at = NOW()
  WHERE
    status IN ('pending', 'processing')
    AND created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension (requires Supabase Pro or self-hosted)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run every 5 minutes
-- SELECT cron.schedule(
--   'cleanup-stale-generations',
--   '*/5 * * * *',
--   'SELECT cleanup_stale_generations()'
-- );
