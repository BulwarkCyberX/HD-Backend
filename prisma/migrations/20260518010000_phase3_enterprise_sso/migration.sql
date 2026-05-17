-- CreateEnum
CREATE TYPE "EnterpriseSsoProtocol" AS ENUM ('OIDC', 'SAML');

-- CreateTable
CREATE TABLE "OrganizationSsoConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "protocol" "EnterpriseSsoProtocol" NOT NULL DEFAULT 'OIDC',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "issuerUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "allowedEmailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSsoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSsoConfig_organizationId_key" ON "OrganizationSsoConfig"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationSsoConfig" ADD CONSTRAINT "OrganizationSsoConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
