ALTER TABLE "customers" ADD COLUMN "tax_code" TEXT;
ALTER TABLE "customers" ADD COLUMN "industry" TEXT;
ALTER TABLE "customers" ADD COLUMN "contact_name" TEXT;
ALTER TABLE "customers" ADD COLUMN "contact_phone" TEXT;
ALTER TABLE "customers" ADD COLUMN "contact_email" TEXT;

ALTER TABLE "opportunities" ADD COLUMN "probability" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "QuoteKind" AS ENUM ('proposal', 'quote', 'po');
ALTER TABLE "quotes" ADD COLUMN "kind" "QuoteKind" NOT NULL DEFAULT 'quote';
