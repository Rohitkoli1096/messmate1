-- MessMate incremental migration (data-preserving)
-- Adds gateway-backed payment tracking, webhook idempotency, and QR rotation tables.
-- Safe to run on an existing database created from database/schema.sql

USE messmate;

-- ---------------------------
-- 1) Extend payments for gateway/UTR/idempotency (preserves existing rows)
-- ---------------------------
ALTER TABLE payments
  ADD COLUMN currency CHAR(3) NULL AFTER paid_amount,
  ADD COLUMN utr VARCHAR(64) NULL AFTER screenshot_url,
  ADD COLUMN idempotency_key VARCHAR(128) NULL AFTER utr,
  ADD COLUMN gateway_provider ENUM('manual','razorpay','cashfree','payu','other') NULL AFTER idempotency_key,
  ADD COLUMN gateway_order_id VARCHAR(128) NULL AFTER gateway_provider,
  ADD COLUMN gateway_payment_id VARCHAR(128) NULL AFTER gateway_order_id,
  ADD COLUMN gateway_signature VARCHAR(255) NULL AFTER gateway_payment_id,
  ADD COLUMN gateway_status VARCHAR(64) NULL AFTER gateway_signature,
  ADD COLUMN paid_at TIMESTAMP NULL AFTER gateway_status,
  ADD COLUMN verified_at TIMESTAMP NULL AFTER verified_by,
  ADD COLUMN metadata JSON NULL AFTER verified_at;

-- Helpful uniqueness/dedupe (keep nullable so old data stays valid)
CREATE UNIQUE INDEX uq_payments_utr ON payments (utr);
CREATE UNIQUE INDEX uq_payments_idempotency_key ON payments (idempotency_key);
CREATE UNIQUE INDEX uq_payments_gateway_order_id ON payments (gateway_provider, gateway_order_id);
CREATE UNIQUE INDEX uq_payments_gateway_payment_id ON payments (gateway_provider, gateway_payment_id);

CREATE INDEX idx_payments_user_created ON payments (user_id, created_at);
CREATE INDEX idx_payments_subscription_created ON payments (subscription_id, created_at);

-- ---------------------------
-- 2) Payment transaction ledger (attempts/events)
-- ---------------------------
CREATE TABLE payment_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  provider ENUM('razorpay','cashfree','payu','other') NOT NULL,
  provider_event_type VARCHAR(64) NULL,
  provider_order_id VARCHAR(128) NULL,
  provider_payment_id VARCHAR(128) NULL,
  idempotency_key VARCHAR(128) NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(32) NOT NULL,
  error_code VARCHAR(64) NULL,
  error_message VARCHAR(255) NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_transactions_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_ptx_provider_payment ON payment_transactions (provider, provider_payment_id);
CREATE UNIQUE INDEX uq_ptx_idempotency ON payment_transactions (idempotency_key);
CREATE INDEX idx_ptx_payment_created ON payment_transactions (payment_id, created_at);

-- ---------------------------
-- 3) Webhook ingest + processing state (idempotency/audit)
-- ---------------------------
CREATE TABLE webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider ENUM('razorpay','cashfree','payu','other') NOT NULL,
  external_event_id VARCHAR(128) NULL,
  event_type VARCHAR(128) NOT NULL,
  signature_valid TINYINT(1) NULL,
  headers JSON NULL,
  payload JSON NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  process_status ENUM('received','processing','processed','failed','ignored') NOT NULL DEFAULT 'received',
  error_message VARCHAR(255) NULL,
  retry_count INT NOT NULL DEFAULT 0,
  payment_transaction_id BIGINT NULL,
  CONSTRAINT fk_webhook_payment_txn
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_webhook_provider_event ON webhook_events (provider, external_event_id);
CREATE INDEX idx_webhook_status_received ON webhook_events (process_status, received_at);

-- ---------------------------
-- 4) QR codes with versioning + active flag + revocation
-- ---------------------------
CREATE TABLE qr_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scope ENUM('payment') NOT NULL DEFAULT 'payment',
  code_value VARCHAR(255) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  revoked_reason VARCHAR(255) NULL,
  created_by INT NULL,
  metadata JSON NULL,
  CONSTRAINT fk_qr_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_qr_code_value ON qr_codes (code_value);
CREATE UNIQUE INDEX uq_qr_scope_version ON qr_codes (scope, version);
CREATE INDEX idx_qr_scope_active ON qr_codes (scope, is_active);

-- ---------------------------
-- 5) Notification audit fields
-- ---------------------------
ALTER TABLE notifications
  ADD COLUMN created_by INT NULL AFTER user_id,
  ADD COLUMN read_at TIMESTAMP NULL AFTER is_read;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_notifications_created_by_created ON notifications (created_by, created_at);

