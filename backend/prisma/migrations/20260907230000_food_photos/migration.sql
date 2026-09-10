-- CreateTable
CREATE TABLE "FoodPhoto" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "aliases" VARCHAR(300) NOT NULL DEFAULT '',
    "sectionKey" VARCHAR(40),
    "image" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodPhoto_cafeId_name_idx" ON "FoodPhoto"("cafeId", "name");

-- CreateIndex
CREATE INDEX "FoodPhoto_cafeId_sectionKey_idx" ON "FoodPhoto"("cafeId", "sectionKey");

-- AddForeignKey
ALTER TABLE "FoodPhoto" ADD CONSTRAINT "FoodPhoto_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
