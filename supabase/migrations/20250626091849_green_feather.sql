/*
  # Add sample crypto holdings data

  1. Sample Data
    - Insert sample holdings for Bitcoin, Solana, and Cardano
    - Add sample transactions
    - Add sample customer payments

  2. Data
    - 1 Bitcoin holding
    - 1 Solana holding  
    - 1 Cardano holding
*/

-- Insert sample crypto holdings for Pri0r1ty AI company
INSERT INTO crypto_holdings (company_id, symbol, name, amount, average_cost)
VALUES 
  ('c0a80121-1234-5678-9abc-def012345678', 'BTC', 'Bitcoin', 1.0, 42500.00),
  ('c0a80121-1234-5678-9abc-def012345678', 'SOL', 'Solana', 1.0, 95.50),
  ('c0a80121-1234-5678-9abc-def012345678', 'ADA', 'Cardano', 1.0, 0.45)
ON CONFLICT (company_id, symbol) DO NOTHING;

-- Insert sample transactions
INSERT INTO crypto_transactions (company_id, type, symbol, amount, price, value, status, tx_hash)
VALUES 
  ('c0a80121-1234-5678-9abc-def012345678', 'buy', 'BTC', 1.0, 42500.00, 42500.00, 'completed', '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'),
  ('c0a80121-1234-5678-9abc-def012345678', 'buy', 'SOL', 1.0, 95.50, 95.50, 'completed', '2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q'),
  ('c0a80121-1234-5678-9abc-def012345678', 'buy', 'ADA', 1.0, 0.45, 0.45, 'completed', '3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r')
ON CONFLICT DO NOTHING;

-- Insert sample customer payments
INSERT INTO customer_crypto_payments (company_id, customer_name, customer_email, amount, symbol, value_gbp, tx_hash, confirmations, status)
VALUES 
  ('c0a80121-1234-5678-9abc-def012345678', 'Acme Corp Ltd', 'payments@acmecorp.com', 0.025, 'BTC', 1062.50, 'abc123def456ghi789jkl012mno345pqr', 6, 'confirmed'),
  ('c0a80121-1234-5678-9abc-def012345678', 'Tech Solutions Inc', 'billing@techsolutions.com', 15.5, 'SOL', 1480.25, 'def456ghi789jkl012mno345pqr678stu', 12, 'confirmed')
ON CONFLICT DO NOTHING;