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

export interface CryptoPrices {
  [symbol: string]: {
    price_usd: number;
    price_gbp: number;
    change_24h: number;
    market_cap: number;
    volume_24h: number;
    last_updated: string;
  }
}

// Fetch live crypto prices from our edge function
export async function getLiveCryptoPrices(): Promise<CryptoPrices> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-prices?ids=bitcoin,ethereum,solana,cardano`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching live crypto prices:', error);
    
    // Fallback to mock data if API fails
    return {
      BTC: { price_usd: 43250.00, price_gbp: 34127.50, change_24h: 2.34, market_cap: 0, volume_24h: 0, last_updated: new Date().toISOString() },
      SOL: { price_usd: 98.75, price_gbp: 78.01, change_24h: 3.41, market_cap: 0, volume_24h: 0, last_updated: new Date().toISOString() },
      ADA: { price_usd: 0.48, price_gbp: 0.38, change_24h: 6.67, market_cap: 0, volume_24h: 0, last_updated: new Date().toISOString() },
      ETH: { price_usd: 2580.50, price_gbp: 2038.60, change_24h: -1.23, market_cap: 0, volume_24h: 0, last_updated: new Date().toISOString() }
    };
  }
}

export async function getCryptoHoldings(companyId: string): Promise<CryptoHolding[]> {
  try {
    const { data, error } = await supabase
      .from('crypto_holdings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch live prices
    const livePrices = await getLiveCryptoPrices();

    // Enhance with current prices and calculations
    const enhancedHoldings = (data || []).map(holding => {
      const priceData = livePrices[holding.symbol] || { price_gbp: 0, change_24h: 0 };
      const currentValue = holding.amount * priceData.price_gbp;
      
      return {
        ...holding,
        current_price: priceData.price_gbp,
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