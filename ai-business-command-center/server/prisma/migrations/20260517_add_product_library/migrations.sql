CREATE TABLE "ProductLibraryItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "productType" TEXT NOT NULL,
  "revenueLane" TEXT,
  "description" TEXT,
  "targetAudience" TEXT,
  "painPoints" TEXT,
  "benefits" TEXT,
  "keywords" TEXT,
  "tags" TEXT,
  "offer" TEXT,
  "cta" TEXT,
  "priceRange" TEXT,
  "productUrl" TEXT,
  "coverImageUrl" TEXT,
  "promotionPriority" INTEGER NOT NULL DEFAULT 3,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductLibraryItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductLibraryItem"
ADD CONSTRAINT "ProductLibraryItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ProductLibraryItem_userId_idx"
ON "ProductLibraryItem"("userId");

CREATE INDEX "ProductLibraryItem_productType_idx"
ON "ProductLibraryItem"("productType");

CREATE INDEX "ProductLibraryItem_revenueLane_idx"
ON "ProductLibraryItem"("revenueLane");

CREATE INDEX "ProductLibraryItem_status_idx"
ON "ProductLibraryItem"("status");

CREATE INDEX "ProductLibraryItem_promotionPriority_idx"
ON "ProductLibraryItem"("promotionPriority");
