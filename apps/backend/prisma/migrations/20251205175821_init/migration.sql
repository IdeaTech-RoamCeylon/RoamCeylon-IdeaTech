/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Vector` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "updatedAt",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL;

-- DropTable
DROP TABLE "Vector";

-- CreateTable
CREATE TABLE "embeddings" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
