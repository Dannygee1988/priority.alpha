import { supabase } from './supabase';

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  average_cost: number;
  current_price?: number;
  value?: number;
  change_24h?: number;
  allocation?: number;
}

export interface CryptoTransaction {
  id: string;
  type: 'buy' | 'sell' | 'receive' | 'send';
  symbol: string;
  amount: number;
  price: number;
  value: number;
  tx_hash?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface CustomerCryptoPayment {
  id: string;
  customer_name: string;
  customer_email?: string;
  amount: number;
  symbol: string;
  value_gbp: number;
  tx_hash: string;
  confirmations: number;
  status: 'confirmed' | 'pending' | 'failed';
  created_at: string;
}

export interface TreasuryReport {
  id: string;
  report_type: 'treasury' | 'governance' | 'tax' | 'risk';
  title: string;
  content: string;
  generated_at: string;
}

// Mock price data - in production this would come from a crypto API
const MOCK_PRICES: Record<string, { price: number; change_24h: number }> = {
  BTC: { price: 43250.00, change_24h: 2.34 },
  SOL: { price: 98.75, change_24h: 3.41 },
  ADA: { price: 0.48, change_24h: 6.67 },
  ETH: { price: 2580.50, change_24h: -1.23 }
};

export async function getCryptoHoldings(companyId: string): Promise<CryptoHolding[]> {
  try {
    const { data, error } = await supabase
      .from('crypto_holdings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enhance with current prices and calculations
    const enhancedHoldings = (data || []).map(holding => {
      const priceData = MOCK_PRICES[holding.symbol] || { price: 0, change_24h: 0 };
      const currentValue = holding.amount * priceData.price;
      
      return {
        ...holding,
        current_price: priceData.price,
        value: currentValue,
        change_24h: priceData.change_24h
      };
    });

    // Calculate allocations
    const totalValue = enhancedHoldings.reduce((sum, h) => sum + (h.value || 0), 0);
    
    return enhancedHoldings.map(holding => ({
      ...holding,
      allocation: totalValue > 0 ? ((holding.value || 0) / totalValue) * 100 : 0
    }));

  } catch (error) {
    console.error('Error fetching crypto holdings:', error);
    throw new Error('Failed to fetch crypto holdings');
  }
}

export async function getCryptoTransactions(companyId: string): Promise<CryptoTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('crypto_transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching crypto transactions:', error);
    throw new Error('Failed to fetch crypto transactions');
  }
}

export async function getCustomerCryptoPayments(companyId: string): Promise<CustomerCryptoPayment[]> {
  try {
    const { data, error } = await supabase
      .from('customer_crypto_payments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customer crypto payments:', error);
    throw new Error('Failed to fetch customer crypto payments');
  }
}

export async function getTreasuryReports(companyId: string): Promise<TreasuryReport[]> {
  try {
    const { data, error } = await supabase
      .from('treasury_reports')
      .select('*')
      .eq('company_id', companyId)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching treasury reports:', error);
    throw new Error('Failed to fetch treasury reports');
  }
}

export async function addCryptoHolding(companyId: string, holding: Omit<CryptoHolding, 'id'>): Promise<CryptoHolding> {
  try {
    const { data, error } = await supabase
      .from('crypto_holdings')
      .insert({
        company_id: companyId,
        symbol: holding.symbol,
        name: holding.name,
        amount: holding.amount,
        average_cost: holding.average_cost
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding crypto holding:', error);
    throw new Error('Failed to add crypto holding');
  }
}

export async function addCryptoTransaction(companyId: string, transaction: Omit<CryptoTransaction, 'id' | 'created_at'>): Promise<CryptoTransaction> {
  try {
    const { data, error } = await supabase
      .from('crypto_transactions')
      .insert({
        company_id: companyId,
        type: transaction.type,
        symbol: transaction.symbol,
        amount: transaction.amount,
        price: transaction.price,
        value: transaction.value,
        tx_hash: transaction.tx_hash,
        status: transaction.status
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding crypto transaction:', error);
    throw new Error('Failed to add crypto transaction');
  }
}

export async function generateTreasuryReport(
  companyId: string, 
  reportType: 'treasury' | 'governance' | 'tax' | 'risk',
  title: string,
  content: string
): Promise<TreasuryReport> {
  try {
    const { data, error } = await supabase
      .from('treasury_reports')
      .insert({
        company_id: companyId,
        report_type: reportType,
        title,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating treasury report:', error);
    throw new Error('Failed to generate treasury report');
  }
}