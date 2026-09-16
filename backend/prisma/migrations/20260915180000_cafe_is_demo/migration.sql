-- AlterTable
ALTER TABLE "Cafe" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Cafe_isDemo_idx" ON "Cafe"("isDemo");
