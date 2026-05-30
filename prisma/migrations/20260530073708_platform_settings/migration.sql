-- CreateEnum
CREATE TYPE "MailProvider" AS ENUM ('AUTO', 'SMTP', 'SENDGRID', 'NONE');

-- CreateEnum
CREATE TYPE "SessionPolicy" AS ENUM ('MULTI_DEVICE', 'SINGLE_DEVICE');

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "mailProvider" "MailProvider" NOT NULL DEFAULT 'AUTO',
    "mailFromAddress" TEXT NOT NULL DEFAULT '',
    "mailFromName" TEXT NOT NULL DEFAULT 'HD Team',
    "mailReplyTo" TEXT NOT NULL DEFAULT '',
    "smtpHost" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL DEFAULT '',
    "smtpPassword" TEXT NOT NULL DEFAULT '',
    "sendgridApiKey" TEXT NOT NULL DEFAULT '',
    "accessTokenExpiryMinutes" INTEGER NOT NULL DEFAULT 15,
    "refreshTokenExpiryDays" INTEGER NOT NULL DEFAULT 7,
    "sessionPolicy" "SessionPolicy" NOT NULL DEFAULT 'MULTI_DEVICE',
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
