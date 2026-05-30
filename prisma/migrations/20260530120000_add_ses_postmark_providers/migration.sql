-- AlterEnum
ALTER TYPE "MailProvider" ADD VALUE 'AWS_SES';
ALTER TYPE "MailProvider" ADD VALUE 'POSTMARK';

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "awsSesAccessKeyId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "awsSesSecretKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN "awsSesRegion" TEXT NOT NULL DEFAULT 'us-east-1',
ADD COLUMN "postmarkServerToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN "primaryMailProvider" "MailProvider" NOT NULL DEFAULT 'SMTP';
