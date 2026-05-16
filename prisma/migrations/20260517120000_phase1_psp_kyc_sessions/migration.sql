-- CreateEnum
CREATE TYPE "PspProviderName" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');
CREATE TYPE "PspCheckoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable ProviderProfile
ALTER TABLE "ProviderProfile" ADD COLUMN "bio" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProviderProfile" ADD COLUMN "portfolio" JSONB;
ALTER TABLE "ProviderProfile" ADD COLUMN "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "PspCheckoutSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "PaymentCurrency" NOT NULL DEFAULT 'INR',
    "provider" "PspProviderName" NOT NULL,
    "status" "PspCheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "PspCheckoutSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "provider" "PspProviderName",
    "providerEventId" TEXT,
    "actorUserId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KycSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "panNumberMasked" TEXT,
    "panHolderName" TEXT,
    "bankAccountLast4" TEXT,
    "bankIfsc" TEXT,
    "bankAccountHolder" TEXT,
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PspCheckoutSession_idempotencyKey_key" ON "PspCheckoutSession"("idempotencyKey");
CREATE UNIQUE INDEX "PspCheckoutSession_paymentId_key" ON "PspCheckoutSession"("paymentId");
CREATE INDEX "PspCheckoutSession_projectId_idx" ON "PspCheckoutSession"("projectId");
CREATE INDEX "PspCheckoutSession_payerId_idx" ON "PspCheckoutSession"("payerId");
CREATE INDEX "PspCheckoutSession_status_idx" ON "PspCheckoutSession"("status");
CREATE INDEX "PspCheckoutSession_providerOrderId_idx" ON "PspCheckoutSession"("providerOrderId");
CREATE INDEX "PspCheckoutSession_providerPaymentId_idx" ON "PspCheckoutSession"("providerPaymentId");

CREATE UNIQUE INDEX "PaymentAuditLog_providerEventId_key" ON "PaymentAuditLog"("providerEventId");
CREATE INDEX "PaymentAuditLog_sessionId_idx" ON "PaymentAuditLog"("sessionId");
CREATE INDEX "PaymentAuditLog_eventType_idx" ON "PaymentAuditLog"("eventType");

CREATE INDEX "KycSubmission_userId_idx" ON "KycSubmission"("userId");
CREATE INDEX "KycSubmission_status_idx" ON "KycSubmission"("status");

CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "PspCheckoutSession" ADD CONSTRAINT "PspCheckoutSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PspCheckoutSession" ADD CONSTRAINT "PspCheckoutSession_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PspCheckoutSession" ADD CONSTRAINT "PspCheckoutSession_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentAuditLog" ADD CONSTRAINT "PaymentAuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PspCheckoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAuditLog" ADD CONSTRAINT "PaymentAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
