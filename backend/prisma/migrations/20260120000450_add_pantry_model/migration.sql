-- CreateTable
CREATE TABLE "Pantry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "category" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Pantry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pantry_userId_idx" ON "Pantry"("userId");

-- CreateIndex
CREATE INDEX "Pantry_userId_category_idx" ON "Pantry"("userId", "category");

-- AddForeignKey
ALTER TABLE "Pantry" ADD CONSTRAINT "Pantry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
