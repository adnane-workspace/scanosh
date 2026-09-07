-- CreateEnum
CREATE TYPE "MenuImportStatus" AS ENUM ('pending', 'reviewed', 'published', 'failed');

-- CreateTable
CREATE TABLE "MenuImport" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "status" "MenuImportStatus" NOT NULL DEFAULT 'pending',
    "sourceImageUrl" TEXT NOT NULL DEFAULT '',
    "mergeLevel" VARCHAR(20) NOT NULL DEFAULT 'paragraph',
    "rawText" TEXT NOT NULL DEFAULT '',
    "rawBlocks" JSONB NOT NULL DEFAULT '[]',
    "draftMenu" JSONB,
    "provider" VARCHAR(80) NOT NULL DEFAULT '',
    "errorMessage" VARCHAR(500) NOT NULL DEFAULT '',
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuImport_cafeId_createdAt_idx" ON "MenuImport"("cafeId", "createdAt");

-- CreateIndex
CREATE INDEX "MenuImport_cafeId_status_idx" ON "MenuImport"("cafeId", "status");

-- AddForeignKey
ALTER TABLE "MenuImport" ADD CONSTRAINT "MenuImport_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
