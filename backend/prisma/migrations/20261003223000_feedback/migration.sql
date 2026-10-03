-- AlterTable
ALTER TABLE "Cafe" ADD COLUMN "googleReviewUrl" VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE "Cafe" ADD COLUMN "googlePlaceId" VARCHAR(120);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(1000) NOT NULL DEFAULT '',
    "sentiment" VARCHAR(20),
    "tags" JSONB NOT NULL DEFAULT '[]',
    "aiSummary" JSONB,
    "ipHash" VARCHAR(64) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Feedback_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- CreateIndex
CREATE INDEX "Feedback_cafeId_createdAt_idx" ON "Feedback"("cafeId", "createdAt");
CREATE INDEX "Feedback_cafeId_rating_idx" ON "Feedback"("cafeId", "rating");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
