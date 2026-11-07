-- Storage policies copied from production on 2026-11-06.
-- Production already has these, so mark this migration as applied there
-- (supabase migration repair) before the first db push.
-- The letters bucket has no policy on purpose: only the service role reads it.

CREATE POLICY "Faculty: read own logo" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'faculty-logos'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));

CREATE POLICY "Faculty: read own signature" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'faculty-signatures'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));

CREATE POLICY "Faculty: replace own logo" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'faculty-logos'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text"))) WITH CHECK ((("bucket_id" = 'faculty-logos'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));

CREATE POLICY "Faculty: replace own signature" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'faculty-signatures'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text"))) WITH CHECK ((("bucket_id" = 'faculty-signatures'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));

CREATE POLICY "Faculty: upload own logo" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'faculty-logos'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));

CREATE POLICY "Faculty: upload own signature" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'faculty-signatures'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));
