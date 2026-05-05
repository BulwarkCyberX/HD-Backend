/*
  Warnings:

  - Added the required column `assets` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `budgetAmount` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `budgetType` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testingWindow` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeline` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('FIXED', 'HOURLY', 'MILESTONE');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "assets" JSONB NOT NULL,
ADD COLUMN     "budgetAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "budgetType" "BudgetType" NOT NULL,
ADD COLUMN     "inScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "outOfScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "testingWindow" TEXT NOT NULL,
ADD COLUMN     "timeline" TEXT NOT NULL,
ADD COLUMN     "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PUBLIC';
