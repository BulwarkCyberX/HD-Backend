-- CreateEnum
CREATE TYPE "BugBountyProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "BugReportStatus" AS ENUM ('SUBMITTED', 'VALID', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_BID', 'BID_ACCEPTED', 'REPORT_SUBMITTED', 'REPORT_VALIDATED', 'PAYMENT_RELEASED', 'BUG_BOUNTY_REPORT_SUBMITTED');

-- CreateTable
CREATE TABLE "BugBountyProgram" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "scope" JSONB NOT NULL,
    "rewardTable" JSONB NOT NULL,
    "status" "BugBountyProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "allowedResearcherIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugBountyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "researcherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "ReportSeverity" NOT NULL,
    "status" "BugReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VdpProgram" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "policy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VdpProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VdpSubmission" (
    "id" TEXT NOT NULL,
    "vdpId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactEmail" TEXT,
    "severity" "ReportSeverity",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VdpSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "projectId" TEXT,
    "workspaceReportId" TEXT,
    "bugReportId" TEXT,
    "messageId" TEXT,
    "vdpSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugBountyProgram_clientId_idx" ON "BugBountyProgram"("clientId");

-- CreateIndex
CREATE INDEX "BugBountyProgram_status_idx" ON "BugBountyProgram"("status");

-- CreateIndex
CREATE INDEX "BugReport_programId_idx" ON "BugReport"("programId");

-- CreateIndex
CREATE INDEX "BugReport_researcherId_idx" ON "BugReport"("researcherId");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "VdpProgram_clientId_idx" ON "VdpProgram"("clientId");

-- CreateIndex
CREATE INDEX "VdpSubmission_vdpId_idx" ON "VdpSubmission"("vdpId");

-- CreateIndex
CREATE INDEX "FileAsset_uploadedById_idx" ON "FileAsset"("uploadedById");

-- CreateIndex
CREATE INDEX "FileAsset_projectId_idx" ON "FileAsset"("projectId");

-- CreateIndex
CREATE INDEX "FileAsset_workspaceReportId_idx" ON "FileAsset"("workspaceReportId");

-- CreateIndex
CREATE INDEX "FileAsset_bugReportId_idx" ON "FileAsset"("bugReportId");

-- CreateIndex
CREATE INDEX "FileAsset_messageId_idx" ON "FileAsset"("messageId");

-- CreateIndex
CREATE INDEX "FileAsset_vdpSubmissionId_idx" ON "FileAsset"("vdpSubmissionId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "LoginCode_email_idx" ON "LoginCode"("email");

-- CreateIndex
CREATE INDEX "LoginCode_email_expiresAt_idx" ON "LoginCode"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "LoginCode_email_consumedAt_idx" ON "LoginCode"("email", "consumedAt");

-- AddForeignKey
ALTER TABLE "BugBountyProgram" ADD CONSTRAINT "BugBountyProgram_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_programId_fkey" FOREIGN KEY ("programId") REFERENCES "BugBountyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VdpProgram" ADD CONSTRAINT "VdpProgram_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VdpSubmission" ADD CONSTRAINT "VdpSubmission_vdpId_fkey" FOREIGN KEY ("vdpId") REFERENCES "VdpProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_workspaceReportId_fkey" FOREIGN KEY ("workspaceReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "BugReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_vdpSubmissionId_fkey" FOREIGN KEY ("vdpSubmissionId") REFERENCES "VdpSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
