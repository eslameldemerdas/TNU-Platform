CREATE TYPE "MarketplaceCategory" AS ENUM ('textbook', 'hardware_kit', 'drawing_gear', 'components', 'other');
CREATE TYPE "MarketplaceCondition" AS ENUM ('like_new', 'good', 'fair');
CREATE TYPE "MarketplaceStatus" AS ENUM ('active', 'sold');
CREATE TYPE "LostFoundType" AS ENUM ('lost', 'found');
CREATE TYPE "LostFoundStatus" AS ENUM ('open', 'resolved');

CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" "MarketplaceCategory" NOT NULL,
    "condition" "MarketplaceCondition" NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MarketplaceStatus" NOT NULL DEFAULT 'active',
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LostFoundPost" (
    "id" TEXT NOT NULL,
    "type" "LostFoundType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "status" "LostFoundStatus" NOT NULL DEFAULT 'open',
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LostFoundPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "MarketplaceListing"("sellerId");
CREATE INDEX "MarketplaceListing_createdAt_idx" ON "MarketplaceListing"("createdAt");
CREATE INDEX "LostFoundPost_status_idx" ON "LostFoundPost"("status");
CREATE INDEX "LostFoundPost_reporterId_idx" ON "LostFoundPost"("reporterId");
CREATE INDEX "LostFoundPost_createdAt_idx" ON "LostFoundPost"("createdAt");

ALTER TABLE "MarketplaceListing"
  ADD CONSTRAINT "MarketplaceListing_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LostFoundPost"
  ADD CONSTRAINT "LostFoundPost_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
