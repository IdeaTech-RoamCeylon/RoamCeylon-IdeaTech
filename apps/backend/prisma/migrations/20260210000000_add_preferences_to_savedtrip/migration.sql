-- CreateTable
ALTER TABLE "SavedTrip" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
