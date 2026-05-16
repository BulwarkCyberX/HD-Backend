-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED');

-- CreateEnum
CREATE TYPE "HourlyEngagementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- AlterEnum
ALTER TYPE "LedgerEntryType" ADD VALUE 'HOURLY_BILL';

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ClientProfile" ADD COLUMN "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ClientReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyEngagement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hourlyRate" DECIMAL(18,4) NOT NULL,
    "currency" "PaymentCurrency" NOT NULL DEFAULT 'INR',
    "weeklyCapHours" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "status" "HourlyEngagementStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourlyEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "hours" DECIMAL(8,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedReason" TEXT,
    "billedAt" TIMESTAMP(3),
    "billedAmount" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "emailDigestWeekly" BOOLEAN NOT NULL DEFAULT true,
    "lastEmailDigestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientReview_projectId_key" ON "ClientReview"("projectId");
CREATE INDEX "ClientReview_clientId_idx" ON "ClientReview"("clientId");
CREATE INDEX "ClientReview_providerId_idx" ON "ClientReview"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyEngagement_projectId_key" ON "HourlyEngagement"("projectId");

-- CreateIndex
CREATE INDEX "TimeEntry_engagementId_idx" ON "TimeEntry"("engagementId");
CREATE INDEX "TimeEntry_providerId_idx" ON "TimeEntry"("providerId");
CREATE INDEX "TimeEntry_engagementId_status_idx" ON "TimeEntry"("engagementId", "status");

-- AddForeignKey
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyEngagement" ADD CONSTRAINT "HourlyEngagement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "HourlyEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
