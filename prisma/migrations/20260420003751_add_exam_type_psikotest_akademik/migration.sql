-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('SKD', 'PSIKOTEST', 'AKADEMIK');

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "selected2" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "akademikCategory" TEXT,
ADD COLUMN     "examType" "ExamType" NOT NULL DEFAULT 'SKD',
ADD COLUMN     "psikotestCategory" TEXT,
ADD COLUMN     "psikotestConfig" TEXT;

-- AlterTable
ALTER TABLE "ExamAttempt" ADD COLUMN     "akademikScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kecerdasanScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kecermatanScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kepribadianScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "correctOption2" TEXT,
ADD COLUMN     "subCategory" TEXT,
ALTER COLUMN "category" SET DEFAULT 'TWK';
