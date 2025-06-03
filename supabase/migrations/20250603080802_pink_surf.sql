/*
  # Add LSE URL to RNS documents

  1. Changes
    - Add lse_url column to rns_documents table
    - Column is optional (nullable)
    - Stores the URL to the London Stock Exchange announcement
*/

ALTER TABLE rns_documents
ADD COLUMN IF NOT EXISTS lse_url text;