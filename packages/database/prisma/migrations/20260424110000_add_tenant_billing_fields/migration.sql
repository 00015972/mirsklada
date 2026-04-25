-- Add billing and subscription sync fields to tenants
ALTER TABLE "tenants"
ADD COLUMN "billing_provider" VARCHAR(50),
ADD COLUMN "billing_external_app_user_id" VARCHAR(255),
ADD COLUMN "billing_external_customer_id" VARCHAR(255),
ADD COLUMN "billing_external_subscription_id" VARCHAR(255),
ADD COLUMN "billing_subscription_status" VARCHAR(30),
ADD COLUMN "billing_current_period_end" TIMESTAMP(3),
ADD COLUMN "billing_last_event_id" VARCHAR(255),
ADD COLUMN "billing_last_event_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "tenants_billing_external_app_user_id_key" ON "tenants" ("billing_external_app_user_id");