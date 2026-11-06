


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."Role" AS ENUM (
    'STUDENT',
    'FACULTY',
    'ADMIN'
);


ALTER TYPE "public"."Role" OWNER TO "postgres";


CREATE TYPE "public"."letter_request_status" AS ENUM (
    'invited',
    'requested',
    'in_progress',
    'completed',
    'rejected'
);


ALTER TYPE "public"."letter_request_status" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "letter_id" "uuid" NOT NULL,
    "delivery_link_id" "uuid",
    "accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewer_email_hash" "text",
    "ip" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."access_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_access_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_link_id" "uuid",
    "event_type" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_access_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "letter_id" "uuid" NOT NULL,
    "token_hash" "text",
    "recipient_email_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone,
    "consumed_at" timestamp with time zone,
    "payment_status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "stripe_checkout_session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "school_name" "text",
    "student_user_id" "uuid",
    "recipient_email" "text",
    CONSTRAINT "delivery_links_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['unpaid'::"text", 'paid'::"text", 'refunded'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."delivery_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faculty" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "institution" "text",
    "institution_opeid" "text",
    "title" "text",
    "department" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "country" "text",
    "state" "text",
    "city" "text",
    "postal_code" "text",
    "street" "text",
    "logo_storage_path" "text",
    "signature_storage_path" "text",
    "prefix" "text",
    "logo_uploaded_at" timestamp with time zone,
    "signature_uploaded_at" timestamp with time zone
);


ALTER TABLE "public"."faculty" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."letter_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "faculty_id" "uuid",
    "course_context" "text",
    "student_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "professor_email" "text",
    "status" "public"."letter_request_status" DEFAULT 'requested'::"public"."letter_request_status" NOT NULL
);


ALTER TABLE "public"."letter_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."letter_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "letter_id" "uuid" NOT NULL,
    "pdf_sha256" "text" NOT NULL,
    "signature" "text" NOT NULL,
    "signature_alg" "text" DEFAULT 'ed25519'::"text" NOT NULL,
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signing_key_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."letter_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."letters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "faculty_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "letter_body_json" "jsonb",
    "letter_body_html" "text",
    "storage_path" "text",
    "finalized_at" timestamp with time zone,
    "finalized_ip" "text",
    "finalized_user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_draft" boolean DEFAULT true NOT NULL,
    "recommender_snapshot" "jsonb",
    "letterhead_logo_storage_path" "text",
    "signature_image_storage_path" "text",
    "letter_plain_text" "text",
    "student_preview_enabled" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "letters_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'final'::"text"])))
);


ALTER TABLE "public"."letters" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."letters_student_view" WITH ("security_invoker"='true') AS
 SELECT "id",
    "request_id",
    "faculty_id",
    "student_id",
    "status",
    "is_draft",
    "finalized_at",
    "created_at",
    "updated_at"
   FROM "public"."letters";


ALTER VIEW "public"."letters_student_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "letter_id" "uuid",
    "delivery_link_id" "uuid",
    "stripe_event_id" "text" NOT NULL,
    "stripe_event_type" "text" NOT NULL,
    "amount_cents" integer,
    "currency" "text" DEFAULT 'usd'::"text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "university" "text",
    "university_opeid" "text",
    "program" "text",
    "graduation_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."students" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_logs"
    ADD CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_access_events"
    ADD CONSTRAINT "delivery_access_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_links"
    ADD CONSTRAINT "delivery_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faculty"
    ADD CONSTRAINT "faculty_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."letter_requests"
    ADD CONSTRAINT "letter_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."letter_signatures"
    ADD CONSTRAINT "letter_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_request_id_unique" UNIQUE ("request_id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



CREATE INDEX "access_logs_letter_id_idx" ON "public"."access_logs" USING "btree" ("letter_id");



CREATE INDEX "delivery_links_letter_id_idx" ON "public"."delivery_links" USING "btree" ("letter_id");



CREATE UNIQUE INDEX "delivery_links_token_hash_idx" ON "public"."delivery_links" USING "btree" ("token_hash");



CREATE INDEX "letter_requests_faculty_id_idx" ON "public"."letter_requests" USING "btree" ("faculty_id");



CREATE INDEX "letter_requests_student_id_idx" ON "public"."letter_requests" USING "btree" ("student_id");



CREATE UNIQUE INDEX "letter_signatures_letter_id_idx" ON "public"."letter_signatures" USING "btree" ("letter_id");



CREATE INDEX "letters_faculty_id_idx" ON "public"."letters" USING "btree" ("faculty_id");



CREATE INDEX "letters_request_id_idx" ON "public"."letters" USING "btree" ("request_id");



CREATE INDEX "letters_student_id_idx" ON "public"."letters" USING "btree" ("student_id");



CREATE UNIQUE INDEX "payment_events_stripe_event_id_idx" ON "public"."payment_events" USING "btree" ("stripe_event_id");



ALTER TABLE ONLY "public"."access_logs"
    ADD CONSTRAINT "access_logs_delivery_link_id_fkey" FOREIGN KEY ("delivery_link_id") REFERENCES "public"."delivery_links"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."access_logs"
    ADD CONSTRAINT "access_logs_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_access_events"
    ADD CONSTRAINT "delivery_access_events_delivery_link_id_fkey" FOREIGN KEY ("delivery_link_id") REFERENCES "public"."delivery_links"("id");



ALTER TABLE ONLY "public"."delivery_links"
    ADD CONSTRAINT "delivery_links_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."faculty"
    ADD CONSTRAINT "faculty_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."letter_requests"
    ADD CONSTRAINT "letter_requests_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."letter_requests"
    ADD CONSTRAINT "letter_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."letter_signatures"
    ADD CONSTRAINT "letter_signatures_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."letter_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_delivery_link_id_fkey" FOREIGN KEY ("delivery_link_id") REFERENCES "public"."delivery_links"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow faculty to view access events for letters they wrote" ON "public"."delivery_access_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."delivery_links" "dl"
     JOIN "public"."letters" "l" ON (("l"."id" = "dl"."letter_id")))
     JOIN "public"."faculty" "f" ON (("f"."id" = "l"."faculty_id")))
  WHERE (("dl"."id" = "delivery_access_events"."delivery_link_id") AND ("f"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow students to view their own letter access events" ON "public"."delivery_access_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."delivery_links" "dl"
  WHERE (("dl"."id" = "delivery_access_events"."delivery_link_id") AND ("dl"."student_user_id" = "auth"."uid"())))));



ALTER TABLE "public"."access_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "access_logs: faculty select" ON "public"."access_logs" FOR SELECT TO "authenticated" USING (("letter_id" IN ( SELECT "letters"."id"
   FROM "public"."letters"
  WHERE ("letters"."faculty_id" = ( SELECT "faculty"."id"
           FROM "public"."faculty"
          WHERE ("faculty"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."delivery_access_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delivery_links: faculty select" ON "public"."delivery_links" FOR SELECT TO "authenticated" USING (("letter_id" IN ( SELECT "letters"."id"
   FROM "public"."letters"
  WHERE ("letters"."faculty_id" = ( SELECT "faculty"."id"
           FROM "public"."faculty"
          WHERE ("faculty"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."faculty" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "faculty: own row select" ON "public"."faculty" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "faculty: own row update" ON "public"."faculty" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."letter_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "letter_requests: faculty select" ON "public"."letter_requests" FOR SELECT TO "authenticated" USING (("faculty_id" = ( SELECT "faculty"."id"
   FROM "public"."faculty"
  WHERE ("faculty"."user_id" = "auth"."uid"()))));



CREATE POLICY "letter_requests: faculty update" ON "public"."letter_requests" FOR UPDATE TO "authenticated" USING (("faculty_id" = ( SELECT "faculty"."id"
   FROM "public"."faculty"
  WHERE ("faculty"."user_id" = "auth"."uid"())))) WITH CHECK (("faculty_id" = ( SELECT "faculty"."id"
   FROM "public"."faculty"
  WHERE ("faculty"."user_id" = "auth"."uid"()))));



CREATE POLICY "letter_requests: student insert" ON "public"."letter_requests" FOR INSERT TO "authenticated" WITH CHECK (("student_id" = ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



CREATE POLICY "letter_requests: student select" ON "public"."letter_requests" FOR SELECT TO "authenticated" USING (("student_id" = ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."letter_signatures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "letter_signatures: faculty select" ON "public"."letter_signatures" FOR SELECT TO "authenticated" USING (("letter_id" IN ( SELECT "letters"."id"
   FROM "public"."letters"
  WHERE ("letters"."faculty_id" = ( SELECT "faculty"."id"
           FROM "public"."faculty"
          WHERE ("faculty"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."letters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "letters: faculty full access" ON "public"."letters" TO "authenticated" USING (("faculty_id" = ( SELECT "faculty"."id"
   FROM "public"."faculty"
  WHERE ("faculty"."user_id" = "auth"."uid"())))) WITH CHECK (("faculty_id" = ( SELECT "faculty"."id"
   FROM "public"."faculty"
  WHERE ("faculty"."user_id" = "auth"."uid"()))));



CREATE POLICY "letters: student select metadata" ON "public"."letters" FOR SELECT TO "authenticated" USING (("student_id" = ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_events: faculty select" ON "public"."payment_events" FOR SELECT TO "authenticated" USING (("letter_id" IN ( SELECT "letters"."id"
   FROM "public"."letters"
  WHERE ("letters"."faculty_id" = ( SELECT "faculty"."id"
           FROM "public"."faculty"
          WHERE ("faculty"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "students: own row select" ON "public"."students" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "students: own row update" ON "public"."students" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "authenticated";





































































































































































GRANT ALL ON TABLE "public"."access_logs" TO "service_role";
GRANT ALL ON TABLE "public"."access_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."delivery_access_events" TO "service_role";
GRANT ALL ON TABLE "public"."delivery_access_events" TO "authenticated";



GRANT ALL ON TABLE "public"."delivery_links" TO "service_role";
GRANT ALL ON TABLE "public"."delivery_links" TO "authenticated";



GRANT ALL ON TABLE "public"."faculty" TO "service_role";
GRANT ALL ON TABLE "public"."faculty" TO "authenticated";



GRANT ALL ON TABLE "public"."letter_requests" TO "service_role";
GRANT ALL ON TABLE "public"."letter_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."letter_signatures" TO "service_role";
GRANT ALL ON TABLE "public"."letter_signatures" TO "authenticated";



GRANT ALL ON TABLE "public"."letters" TO "service_role";
GRANT ALL ON TABLE "public"."letters" TO "authenticated";



GRANT ALL ON TABLE "public"."letters_student_view" TO "service_role";



GRANT ALL ON TABLE "public"."payment_events" TO "service_role";
GRANT ALL ON TABLE "public"."payment_events" TO "authenticated";



GRANT ALL ON TABLE "public"."students" TO "service_role";
GRANT ALL ON TABLE "public"."students" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




























