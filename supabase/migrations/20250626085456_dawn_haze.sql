/*
  # Create Pr1Bit Cryptocurrency Treasury Tables

  1. New Tables
    - `crypto_holdings`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `symbol` (text) - BTC, ETH, etc.
      - `name` (text) - Bitcoin, Ethereum, etc.
      - `amount` (numeric) - Amount held
      - `average_cost` (numeric) - Average cost basis
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `crypto_transactions`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `type` (text) - buy, sell, receive, send
      - `symbol` (text)
      - `amount` (numeric)
      - `price` (numeric)
      - `value` (numeric)
      - `tx_hash` (text)
      - `status` (text) - completed, pending, failed
      - `created_at` (timestamptz)

    - `customer_crypto_payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `customer_name` (text)
      - `customer_email` (text)
      - `amount` (numeric)
      - `symbol` (text)
      - `value_gbp` (numeric)
      - `tx_hash` (text)
      - `confirmations` (integer)
      - `status` (text) - confirmed, pending, failed
      - `created_at` (timestamptz)

    - `treasury_reports`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `report_type` (text) - treasury, governance, tax, risk
      - `title` (text)
      - `content` (text)
      - `generated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their company's crypto data
*/

-- Create crypto_holdings table
CREATE TABLE IF NOT EXISTS crypto_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  symbol text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  average_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount >= 0),
  CONSTRAINT positive_cost CHECK (average_cost >= 0),
  CONSTRAINT valid_symbol CHECK (char_length(symbol) >= 2 AND char_length(symbol) <= 10),
  UNIQUE (company_id, symbol)
);

-- Create crypto_transactions table
CREATE TABLE IF NOT EXISTS crypto_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  type text NOT NULL CHECK (type IN ('buy', 'sell', 'receive', 'send')),
  symbol text NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  value numeric NOT NULL DEFAULT 0,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_value CHECK (value >= 0)
);

-- Create customer_crypto_payments table
CREATE TABLE IF NOT EXISTS customer_crypto_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  customer_name text NOT NULL,
  customer_email text,
  amount numeric NOT NULL,
  symbol text NOT NULL,
  value_gbp numeric NOT NULL,
  tx_hash text NOT NULL,
  confirmations integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'failed')),
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_value CHECK (value_gbp > 0),
  CONSTRAINT positive_confirmations CHECK (confirmations >= 0),
  CONSTRAINT valid_email CHECK (customer_email IS NULL OR customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create treasury_reports table
CREATE TABLE IF NOT EXISTS treasury_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  report_type text NOT NULL CHECK (report_type IN ('treasury', 'governance', 'tax', 'risk')),
  title text NOT NULL,
  content text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT title_length CHECK (char_length(title) >= 3),
  CONSTRAINT content_length CHECK (char_length(content) >= 10)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_holdings_company_id ON crypto_holdings(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_holdings_symbol ON crypto_holdings(symbol);

CREATE INDEX IF NOT EXISTS idx_crypto_transactions_company_id ON crypto_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_symbol ON crypto_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_type ON crypto_transactions(type);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON crypto_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created_at ON crypto_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_crypto_payments_company_id ON customer_crypto_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_crypto_payments_symbol ON customer_crypto_payments(symbol);
CREATE INDEX IF NOT EXISTS idx_customer_crypto_payments_status ON customer_crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_customer_crypto_payments_created_at ON customer_crypto_payments(created_at);

CREATE INDEX IF NOT EXISTS idx_treasury_reports_company_id ON treasury_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_treasury_reports_type ON treasury_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_treasury_reports_generated_at ON treasury_reports(generated_at);

-- Enable RLS
ALTER TABLE crypto_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for crypto_holdings
CREATE POLICY "Users can manage own company crypto holdings"
  ON crypto_holdings
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for crypto_transactions
CREATE POLICY "Users can manage own company crypto transactions"
  ON crypto_transactions
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for customer_crypto_payments
CREATE POLICY "Users can manage own company customer crypto payments"
  ON customer_crypto_payments
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for treasury_reports
CREATE POLICY "Users can manage own company treasury reports"
  ON treasury_reports
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_crypto_holdings_updated_at
  BEFORE UPDATE ON crypto_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();