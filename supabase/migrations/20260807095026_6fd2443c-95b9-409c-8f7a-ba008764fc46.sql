REVOKE EXECUTE ON FUNCTION public.log_reservation_timeline() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_role_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_ceo_roles() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_payment_on_paid() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_activity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_notification_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_booking_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_venue_reservation_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_event_reservation_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_booking_payment_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_event_schedule() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_last_ceo_removal() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_booking_reference(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.archive_past_events() FROM anon, authenticated;

COMMENT ON TABLE public.booking_ref_counters IS 'Internal only: sequence counters for booking references. RLS enabled with no policies on purpose - reachable only by security-definer function next_booking_reference().';