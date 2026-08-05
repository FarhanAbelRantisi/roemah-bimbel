-- CreateEnum
CREATE TYPE "SkdTrack" AS ENUM ('CPNS', 'KEDINASAN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "skdTrack" "SkdTrack";
