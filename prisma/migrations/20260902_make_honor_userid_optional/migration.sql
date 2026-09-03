-- Make HonorStudent.userId optional (nullable) to support honor roll entries
-- for students who do not yet have a platform User account.
-- Also relax the FK onDelete from Cascade to SetNull.

ALTER TABLE "HonorStudent" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "HonorStudent" DROP CONSTRAINT "HonorStudent_userId_fkey";

ALTER TABLE "HonorStudent"
  ADD CONSTRAINT "HonorStudent_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
