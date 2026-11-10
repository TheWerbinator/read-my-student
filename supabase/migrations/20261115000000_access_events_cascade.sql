-- The daily cleanup deletes letters 365 days after finalization, which cascades
-- to their delivery_links. delivery_access_events had no ON DELETE rule, so any
-- letter a school had opened could not be deleted. The access events (with IP
-- and user agent) now go with the link, so nothing outlives the letter.
ALTER TABLE public.delivery_access_events
  DROP CONSTRAINT delivery_access_events_delivery_link_id_fkey,
  ADD CONSTRAINT delivery_access_events_delivery_link_id_fkey
    FOREIGN KEY (delivery_link_id) REFERENCES public.delivery_links(id) ON DELETE CASCADE;
