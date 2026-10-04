-- CreateEnum
CREATE TYPE "AdaptationStatus" AS ENUM ('APPLIED', 'ACCEPTED', 'IN_PRODUCTION', 'RELEASED', 'DECLINED');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "adaptInvited" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Adaptation" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" "AdaptationStatus" NOT NULL DEFAULT 'APPLIED',
    "sharePct" DOUBLE PRECISION NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "metrics" JSONB NOT NULL,
    "aiAssessment" JSONB,
    "editorNote" TEXT,
    "reviewerId" TEXT,
    "releaseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adaptation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptationRevenue" (
    "id" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "netCents" INTEGER NOT NULL,
    "authorCents" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdaptationRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Adaptation_storyId_key" ON "Adaptation"("storyId");

-- CreateIndex
CREATE INDEX "Adaptation_status_idx" ON "Adaptation"("status");

-- CreateIndex
CREATE INDEX "Adaptation_authorId_idx" ON "Adaptation"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "AdaptationRevenue_adaptationId_month_key" ON "AdaptationRevenue"("adaptationId", "month");

-- AddForeignKey
ALTER TABLE "Adaptation" ADD CONSTRAINT "Adaptation_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adaptation" ADD CONSTRAINT "Adaptation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adaptation" ADD CONSTRAINT "Adaptation_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptationRevenue" ADD CONSTRAINT "AdaptationRevenue_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "Adaptation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
