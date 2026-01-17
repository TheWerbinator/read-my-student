-- AddColumn supabaseId to User table
ALTER TABLE "User" ADD COLUMN "supabaseId" TEXT NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_supabaseId_key" UNIQUE ("supabaseId");
-- DropColumn passwordHash from User table
ALTER TABLE "User" DROP COLUMN "passwordHash";
