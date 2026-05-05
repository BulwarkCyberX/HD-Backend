-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'NEED_MORE_INFO', 'VALID', 'REJECTED');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "triageNotes" TEXT,
ADD COLUMN     "validatedBy" TEXT;

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_validatedBy_idx" ON "Report"("validatedBy");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
