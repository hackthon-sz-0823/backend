-- CreateTable
CREATE TABLE "public"."classifications" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "image_url" TEXT NOT NULL,
    "expected_category" VARCHAR(50) NOT NULL,
    "ai_detected_category" VARCHAR(50),
    "ai_confidence" DECIMAL(3,2),
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "ai_analysis" TEXT,
    "ai_response" JSONB,
    "processing_time_ms" INTEGER,
    "user_location" VARCHAR(100),
    "device_info" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."score_transactions" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "reference_id" INTEGER,
    "reference_type" VARCHAR(50),
    "description" TEXT,
    "metadata" JSONB,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "score_reward" INTEGER NOT NULL,
    "icon_url" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requirements" JSONB,
    "max_claims" INTEGER,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_achievements" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nft_pool" (
    "id" SERIAL NOT NULL,
    "token_id" INTEGER,
    "contract_address" VARCHAR(42) NOT NULL,
    "metadata_uri" TEXT NOT NULL,
    "image_url" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    "rarity" INTEGER NOT NULL DEFAULT 1,
    "category" VARCHAR(50) NOT NULL,
    "required_score" INTEGER,
    "required_classifications" INTEGER,
    "required_accuracy" DECIMAL(5,2),
    "required_achievements" VARCHAR(50)[],
    "required_level" INTEGER,
    "claimed_by_wallet" VARCHAR(42),
    "claimed_at" TIMESTAMP(3),
    "reserved_until" TIMESTAMP(3),
    "attributes" JSONB,
    "external_url" TEXT,
    "animation_url" TEXT,
    "background_color" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" VARCHAR(42),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nft_claims" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "nft_pool_id" INTEGER NOT NULL,
    "transaction_hash" VARCHAR(66),
    "block_number" BIGINT,
    "gas_used" BIGINT,
    "gas_fee" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_config" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" VARCHAR(42),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_logs" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42),
    "endpoint" VARCHAR(200) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "request_size" INTEGER,
    "response_size" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_classifications_wallet" ON "public"."classifications"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_classifications_created_at" ON "public"."classifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_classifications_is_correct" ON "public"."classifications"("is_correct");

-- CreateIndex
CREATE INDEX "idx_classifications_ai_category" ON "public"."classifications"("ai_detected_category");

-- CreateIndex
CREATE INDEX "idx_score_transactions_wallet" ON "public"."score_transactions"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_score_transactions_type" ON "public"."score_transactions"("type");

-- CreateIndex
CREATE INDEX "idx_score_transactions_created_at" ON "public"."score_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_score_transactions_reference" ON "public"."score_transactions"("reference_id", "reference_type");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "public"."achievements"("code");

-- CreateIndex
CREATE INDEX "idx_achievements_code" ON "public"."achievements"("code");

-- CreateIndex
CREATE INDEX "idx_achievements_category" ON "public"."achievements"("category");

-- CreateIndex
CREATE INDEX "idx_achievements_active" ON "public"."achievements"("is_active");

-- CreateIndex
CREATE INDEX "idx_wallet_achievements_wallet" ON "public"."wallet_achievements"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_wallet_achievements_achievement" ON "public"."wallet_achievements"("achievement_id");

-- CreateIndex
CREATE INDEX "idx_wallet_achievements_completed" ON "public"."wallet_achievements"("is_completed");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_achievements_wallet_address_achievement_id_key" ON "public"."wallet_achievements"("wallet_address", "achievement_id");

-- CreateIndex
CREATE INDEX "idx_nft_pool_status" ON "public"."nft_pool"("status");

-- CreateIndex
CREATE INDEX "idx_nft_pool_rarity" ON "public"."nft_pool"("rarity");

-- CreateIndex
CREATE INDEX "idx_nft_pool_category" ON "public"."nft_pool"("category");

-- CreateIndex
CREATE INDEX "idx_nft_pool_required_score" ON "public"."nft_pool"("required_score");

-- CreateIndex
CREATE INDEX "idx_nft_pool_claimed_by" ON "public"."nft_pool"("claimed_by_wallet");

-- CreateIndex
CREATE INDEX "idx_nft_pool_token_id" ON "public"."nft_pool"("token_id");

-- CreateIndex
CREATE INDEX "idx_nft_claims_wallet" ON "public"."nft_claims"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_nft_claims_nft_pool" ON "public"."nft_claims"("nft_pool_id");

-- CreateIndex
CREATE INDEX "idx_nft_claims_status" ON "public"."nft_claims"("status");

-- CreateIndex
CREATE INDEX "idx_nft_claims_tx_hash" ON "public"."nft_claims"("transaction_hash");

-- CreateIndex
CREATE INDEX "idx_nft_claims_requested_at" ON "public"."nft_claims"("requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "public"."system_config"("key");

-- CreateIndex
CREATE INDEX "idx_system_config_category" ON "public"."system_config"("category");

-- CreateIndex
CREATE INDEX "idx_system_config_active" ON "public"."system_config"("is_active");

-- CreateIndex
CREATE INDEX "idx_api_logs_wallet" ON "public"."api_logs"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_api_logs_endpoint" ON "public"."api_logs"("endpoint");

-- CreateIndex
CREATE INDEX "idx_api_logs_created_at" ON "public"."api_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_api_logs_status" ON "public"."api_logs"("status_code");

-- AddForeignKey
ALTER TABLE "public"."wallet_achievements" ADD CONSTRAINT "wallet_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nft_claims" ADD CONSTRAINT "nft_claims_nft_pool_id_fkey" FOREIGN KEY ("nft_pool_id") REFERENCES "public"."nft_pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
