-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "emailVerificationCodeUnit" TEXT NOT NULL DEFAULT 'HOURS',
ADD COLUMN     "emailVerificationCodeValue" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "loginOtpCodeUnit" TEXT NOT NULL DEFAULT 'MINUTES',
ADD COLUMN     "loginOtpCodeValue" INTEGER NOT NULL DEFAULT 10;
