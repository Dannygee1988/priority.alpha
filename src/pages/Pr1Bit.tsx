import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Activity, 
  DollarSign, 
  Users, 
  FileText, 
  Shield, 
  Copy, 
  Check, 
  ExternalLink,
  QrCode,
  MapPin,
  Key,
  TestTube,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { 
  getCryptoHoldings, 
  getCryptoTransactions, 
  getCustomerCryptoPayments, 
  getTreasuryReports,
  getLiveCryptoPrices,
  CryptoHolding,
  CryptoTransaction,
  CustomerCryptoPayment,
  TreasuryReport,
  CryptoPrices
} from '../lib/crypto-api';

const Pr1Bit: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('holdings');
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerCryptoPayment[]>([]);
  const [reports, setReports] = useState<TreasuryReport[]>([]);
  const [livePrices, setLivePrices] = useState<CryptoPrices>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadLivePrices();
    
    // Set up interval to refresh prices every 30 seconds
    const priceInterval = setInterval(loadLivePrices, 30000);
    
    return () => clearInterval(priceInterval);
  }, [user]);

  const loadLivePrices = async () => {
    try {
      setIsLoadingPrices(true);
      const prices = await getLiveCryptoPrices();
      setLivePrices(prices);
    } catch (err) {
      console.error('Error loading live prices:', err);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const [holdingsData, transactionsData, paymentsData, reportsData] = await Promise.all([
        getCryptoHoldings(companyId),
        getCryptoTransactions(companyId),
        getCustomerCryptoPayments(companyId),
        getTreasuryReports(companyId)
      ]);

      setHoldings(holdingsData);
      setTransactions(transactionsData);
      setCustomerPayments(paymentsData);
      setReports(reportsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load treasury data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount: number, symbol: string) => {
    return `${amount.toFixed(8)} ${symbol}`;
  };

  const getCryptoIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTC':
        return (
          <img 
            src="https://res.cloudinary.com/deyzbqzya/image/upload/v1750929236/btc_xki9yg.webp" 
            alt="Bitcoin"
            className="w-8 h-8"
          />
        );
      case 'ETH':
        return <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">ETH</div>;
      case 'SOL':
        return <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">SOL</div>;
      case 'ADA':
        return <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">ADA</div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">{symbol}</div>;
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + (holding.value || 0), 0);
  const totalChange24h = holdings.length > 0 
    ? holdings.reduce((sum, holding) => sum + (holding.change_24h || 0), 0) / holdings.length 
    : 0;

  const mockAddresses = [
    {
      symbol: 'BTC',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 1.0,
      type: 'Native SegWit',
      created: '2024-01-15'
    },
    {
      symbol: 'ETH',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
      balance: 0.0,
      type: 'Standard',
      created: '2024-01-15'
    },
    {
      symbol: 'SOL',
      address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      balance: 1.0,
      type: 'Standard',
      created: '2024-01-15'
    },
    {
      symbol: 'ADA',
      address: 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 1.0,
      type: 'Shelley',
      created: '2024-01-15'
    }
  ];

  const mockKeys = [
    {
      id: '1',
      device: 'Ledger Nano X',
      fingerprint: 'A1B2C3D4',
      status: 'Active',
      created: '2024-01-15',
      lastUsed: '2024-01-20'
    },
    {
      id: '2',
      device: 'Trezor Model T',
      fingerprint: 'E5F6G7H8',
      status: 'Active',
      created: '2024-01-10',
      lastUsed: '2024-01-18'
    },
    {
      id: '3',
      device: 'Cold Storage',
      fingerprint: 'I9J0K1L2',
      status: 'Secure',
      created: '2024-01-05',
      lastUsed: 'Never'
    }
  ];

  const tabs = [
    { id: 'holdings', name: 'Holdings', icon: Wallet },
    { id: 'transactions', name: 'Transactions', icon: Activity },
    { id: 'payments', name: 'Customer Payments', icon: DollarSign },
    { id: 'addresses', name: 'Addresses', icon: MapPin },
    { id: 'reports', name: 'Reports & Governance', icon: FileText },
    { id: 'keys', name: 'Keys', icon: Key }
  ];

  if (isLoading) {
    return (
      <div className="px-4 py-8 animate-fade-in">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Pr1Bit Treasury</h1>
        <p className="text-neutral-500">Manage your cryptocurrency treasury and digital assets</p>
      </div>

      {/* Live Crypto Prices */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">Live Crypto Prices</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLivePrices}
            isLoading={isLoadingPrices}
            leftIcon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(livePrices).map(([symbol, data]) => (
            <div key={symbol} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getCryptoIcon(symbol)}
                  <span className="ml-2 font-medium text-neutral-900">{symbol}</span>
                </div>
                <div className={`flex items-center text-sm ${
                  data.change_24h >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {data.change_24h >= 0 ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : (
                    <TrendingDown size={14} className="mr-1" />
                  )}
                  {data.change_24h >= 0 ? '+' : ''}{data.change_24h.toFixed(2)}%
                </div>
              </div>
              <div className="text-lg font-bold text-neutral-900">
                {formatCurrency(data.price_gbp)}
              </div>
              <div className="text-sm text-neutral-500">
                ${data.price_usd.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Portfolio Value</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {formatCurrency(totalPortfolioValue)}
              </h3>
            </div>
            <Wallet className="text-primary" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">24h Change</p>
              <div className="flex items-center mt-1">
                <h3 className={`text-2xl font-bold ${totalChange24h >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                  {totalChange24h >= 0 ? '+' : ''}{totalChange24h.toFixed(2)}%
                </h3>
                {totalChange24h >= 0 ? (
                  <TrendingUp className="text-success-600 ml-2" size={20} />
                ) : (
                  <TrendingDown className="text-error-600 ml-2" size={20} />
                )}
              </div>
            </div>
            <Activity className="text-primary" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Assets</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {holdings.length}
              </h3>
            </div>
            <Shield className="text-primary" size={24} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-md">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Holdings Tab */}
          {activeTab === 'holdings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Cryptocurrency Holdings</h2>
              </div>

              {holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Asset</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Holdings</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Price</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Value</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">24h Change</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding) => (
                        <tr key={holding.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {getCryptoIcon(holding.symbol)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-neutral-900">{holding.name}</div>
                                <div className="text-sm text-neutral-500">{holding.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCrypto(holding.amount, holding.symbol)}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCurrency(holding.current_price || 0)}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCurrency(holding.value || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <div className={`flex items-center text-sm ${
                              (holding.change_24h || 0) >= 0 ? 'text-success-600' : 'text-error-600'
                            }`}>
                              {(holding.change_24h || 0) >= 0 ? (
                                <ArrowUpRight size={16} className="mr-1" />
                              ) : (
                                <ArrowDownRight size={16} className="mr-1" />
                              )}
                              {(holding.change_24h || 0) >= 0 ? '+' : ''}{(holding.change_24h || 0).toFixed(2)}%
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {(holding.allocation || 0).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No holdings found</h3>
                  <p className="text-neutral-500">Your cryptocurrency holdings will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Transaction History</h2>
              </div>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Asset</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Price</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Value</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'buy' ? 'bg-success-50 text-success-700' :
                              transaction.type === 'sell' ? 'bg-error-50 text-error-700' :
                              'bg-neutral-50 text-neutral-700'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {getCryptoIcon(transaction.symbol)}
                              <span className="ml-2 text-sm font-medium text-neutral-900">{transaction.symbol}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCrypto(transaction.amount, transaction.symbol)}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCurrency(transaction.price)}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCurrency(transaction.value)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' ? 'bg-success-50 text-success-700' :
                              transaction.status === 'pending' ? 'bg-warning-50 text-warning-700' :
                              'bg-error-50 text-error-700'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-600">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No transactions found</h3>
                  <p className="text-neutral-500">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Customer Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Customer Crypto Payments</h2>
              </div>

              {customerPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Customer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Value (GBP)</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Confirmations</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerPayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm font-medium text-neutral-900">{payment.customer_name}</div>
                              {payment.customer_email && (
                                <div className="text-sm text-neutral-500">{payment.customer_email}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {getCryptoIcon(payment.symbol)}
                              <span className="ml-2 text-sm text-neutral-900">
                                {formatCrypto(payment.amount, payment.symbol)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {formatCurrency(payment.value_gbp)}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {payment.confirmations}/6
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'confirmed' ? 'bg-success-50 text-success-700' :
                              payment.status === 'pending' ? 'bg-warning-50 text-warning-700' :
                              'bg-error-50 text-error-700'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-600">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No payments found</h3>
                  <p className="text-neutral-500">Customer crypto payments will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Wallet Addresses</h2>
                <Button leftIcon={<QrCode size={18} />}>
                  Generate QR Code
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockAddresses.map((address) => (
                  <div key={address.symbol} className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getCryptoIcon(address.symbol)}
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-neutral-900">{address.symbol} Address</h3>
                          <p className="text-xs text-neutral-500">{address.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-neutral-900">
                          {formatCrypto(address.balance, address.symbol)}
                        </p>
                        <p className="text-xs text-neutral-500">Created {address.created}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-md p-3 border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <code className="text-xs text-neutral-600 font-mono break-all">
                          {address.address.slice(0, 20)}...{address.address.slice(-10)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(address.address, address.symbol)}
                          className="ml-2 p-1 hover:bg-neutral-100 rounded transition-colors"
                        >
                          {copiedAddress === address.symbol ? (
                            <Check size={16} className="text-success-600" />
                          ) : (
                            <Copy size={16} className="text-neutral-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" leftIcon={<QrCode size={14} />}>
                        QR Code
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<ExternalLink size={14} />}>
                        Explorer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports & Governance Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Treasury Reports & Governance</h2>
              </div>

              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-neutral-900">{report.title}</h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report
                          </p>
                          <p className="text-sm text-neutral-500">
                            Generated on {new Date(report.generated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-neutral-700 line-clamp-3">
                          {report.content.slice(0, 200)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No reports generated</h3>
                  <p className="text-neutral-500 mb-4">Treasury reports will appear here when generated</p>
                </div>
              )}
            </div>
          )}

          {/* Keys Tab */}
          {activeTab === 'keys' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Cryptographic Keys</h2>
                <Button leftIcon={<TestTube size={18} />}>
                  Test Keys
                </Button>
              </div>

              {/* Security Notice */}
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-warning-800">Security Notice</h3>
                    <div className="mt-2 text-sm text-warning-700">
                      <p>
                        Never share your private keys or seed phrases. Always verify hardware wallet authenticity 
                        and keep firmware updated. Store backup phrases in secure, offline locations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockKeys.map((key) => (
                  <div key={key.id} className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Key size={20} />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-neutral-900">{key.device}</h3>
                          <p className="text-xs text-neutral-500">Created {key.created}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        key.status === 'Active' ? 'bg-success-50 text-success-700' : 'bg-neutral-50 text-neutral-700'
                      }`}>
                        {key.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white rounded-md p-3 border border-neutral-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-neutral-500">Fingerprint</p>
                            <code className="text-sm text-neutral-900 font-mono">{key.fingerprint}</code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(key.fingerprint, `key-${key.id}`)}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors"
                          >
                            {copiedAddress === `key-${key.id}` ? (
                              <Check size={16} className="text-success-600" />
                            ) : (
                              <Copy size={16} className="text-neutral-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-500">
                        Last used: {key.lastUsed}
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" leftIcon={<TestTube size={14} />}>
                        Test
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<Shield size={14} />}>
                        Audit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pr1Bit;