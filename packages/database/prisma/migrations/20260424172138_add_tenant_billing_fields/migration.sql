/*
  Warnings:

  - You are about to drop the column `telegram_id` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the `pending_invitations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pending_invitations" DROP CONSTRAINT "pending_invitations_invited_by_fkey";

-- DropForeignKey
ALTER TABLE "pending_invitations" DROP CONSTRAINT "pending_invitations_tenant_id_fkey";

-- DropIndex
DROP INDEX "clients_telegram_id_idx";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "telegram_id";

-- DropTable
DROP TABLE "pending_invitations";
