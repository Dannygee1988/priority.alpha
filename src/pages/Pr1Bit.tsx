import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Download,
  RefreshCw,
  DollarSign,
  PieChart,
  Activity,
  Users,
  CreditCard,
  FileText,
  Shield,
  MapPin,
  Key,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { 
  getCryptoHoldings, 
  getCryptoTransactions, 
  getCustomerCryptoPayments, 
  getTreasuryReports,
  CryptoHolding,
  CryptoTransaction,
  CustomerCryptoPayment,
  TreasuryReport
} from '../lib/crypto-api';

const Pr1Bit: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('holdings');
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerCryptoPayment[]>([]);
  const [reports, setReports] = useState<TreasuryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

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
        return <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">ETH</div>;
      case 'SOL':
        return <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">SOL</div>;
      case 'ADA':
        return <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">ADA</div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-bold">{symbol}</div>;
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

  const copyToClipboard = async (text: string, type: 'address' | 'key') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(text);
        setTimeout(() => setCopiedAddress(null), 2000);
      } else {
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + (holding.value || 0), 0);

  const tabs = [
    { id: 'holdings', label: 'Holdings', icon: PieChart },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'payments', label: 'Customer Payments', icon: CreditCard },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'reports', label: 'Reports & Governance', icon: FileText },
    { id: 'keys', label: 'Keys', icon: Key }
  ];

  // Mock data for addresses
  const mockAddresses = [
    {
      id: '1',
      symbol: 'BTC',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 1.25,
      type: 'Receiving',
      created: '2024-01-15'
    },
    {
      id: '2', 
      symbol: 'ETH',
      address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      balance: 5.75,
      type: 'Receiving',
      created: '2024-01-20'
    },
    {
      id: '3',
      symbol: 'SOL',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      balance: 12.5,
      type: 'Receiving', 
      created: '2024-02-01'
    },
    {
      id: '4',
      symbol: 'ADA',
      address: 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 1000.0,
      type: 'Receiving',
      created: '2024-02-10'
    }
  ];

  // Mock data for keys
  const mockKeys = [
    {
      id: '1',
      device: 'Ledger Nano X',
      fingerprint: 'A1B2C3D4',
      status: 'Active',
      created: '2024-01-10',
      lastUsed: '2024-12-20'
    },
    {
      id: '2',
      device: 'Trezor Model T',
      fingerprint: 'E5F6G7H8',
      status: 'Active',
      created: '2024-01-15',
      lastUsed: '2024-12-18'
    },
    {
      id: '3',
      device: 'Cold Storage',
      fingerprint: 'I9J0K1L2',
      status: 'Secure',
      created: '2024-01-05',
      lastUsed: '2024-11-30'
    }
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

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Portfolio Value</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {formatCurrency(totalPortfolioValue)}
              </h3>
            </div>
            <DollarSign className="text-primary" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Assets</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {holdings.length}
              </h3>
            </div>
            <PieChart className="text-success-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">24h Change</p>
              <h3 className="text-2xl font-bold text-success-600 mt-1 flex items-center">
                +2.34%
                <TrendingUp size={20} className="ml-1" />
              </h3>
            </div>
            <Activity className="text-warning-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Customer Payments</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {customerPayments.length}
              </h3>
            </div>
            <Users className="text-accent" size={24} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
              {error}
            </div>
          )}

          {/* Holdings Tab */}
          {activeTab === 'holdings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Cryptocurrency Holdings</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    leftIcon={<RefreshCw size={18} />}
                    onClick={loadData}
                  >
                    Refresh
                  </Button>
                  <Button leftIcon={<Plus size={18} />}>
                    Add Asset
                  </Button>
                </div>
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
                            {holding.current_price ? formatCurrency(holding.current_price) : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {holding.value ? formatCurrency(holding.value) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {holding.change_24h !== undefined ? (
                              <div className={`flex items-center text-sm ${
                                holding.change_24h >= 0 ? 'text-success-600' : 'text-error-600'
                              }`}>
                                {holding.change_24h >= 0 ? (
                                  <ArrowUpRight size={16} className="mr-1" />
                                ) : (
                                  <ArrowDownRight size={16} className="mr-1" />
                                )}
                                {Math.abs(holding.change_24h).toFixed(2)}%
                              </div>
                            ) : (
                              <span className="text-sm text-neutral-500">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900">
                            {holding.allocation ? `${holding.allocation.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No holdings found</h3>
                  <p className="text-neutral-500 mb-4">Start building your crypto portfolio</p>
                  <Button leftIcon={<Plus size={18} />}>
                    Add Your First Asset
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Transaction History</h2>
                <Button leftIcon={<Plus size={18} />}>
                  Add Transaction
                </Button>
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
                  <p className="text-neutral-500 mb-4">Your transaction history will appear here</p>
                  <Button leftIcon={<Plus size={18} />}>
                    Add Transaction
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Customer Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Customer Crypto Payments</h2>
                <Button leftIcon={<Download size={18} />}>
                  Export
                </Button>
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
                  <CreditCard className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No payments received</h3>
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
                <div className="flex space-x-2">
                  <Button variant="outline" leftIcon={<QrCode size={18} />}>
                    Generate QR
                  </Button>
                  <Button leftIcon={<Plus size={18} />}>
                    New Address
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockAddresses.map((address) => (
                  <div key={address.id} className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {getCryptoIcon(address.symbol)}
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-neutral-900">{address.symbol} Address</h3>
                          <p className="text-xs text-neutral-500">{address.type} • Created {address.created}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(address.address, 'address')}
                          className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === address.address ? (
                            <Check size={16} className="text-success-600" />
                          ) : (
                            <Copy size={16} className="text-neutral-500" />
                          )}
                        </button>
                        <button
                          className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                          title="View on blockchain explorer"
                        >
                          <ExternalLink size={16} className="text-neutral-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-md p-3 mb-4">
                      <p className="text-xs font-mono text-neutral-700 break-all">
                        {address.address}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Balance:</span>
                      <span className="font-medium text-neutral-900">
                        {formatCrypto(address.balance, address.symbol)}
                      </span>
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
                <h2 className="text-lg font-semibold text-neutral-800">Reports & Governance</h2>
                <Button leftIcon={<FileText size={18} />}>
                  Generate Report
                </Button>
              </div>

              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-neutral-900 mb-2">{report.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-neutral-600">
                            <span className="capitalize">{report.report_type} Report</span>
                            <span>Generated {new Date(report.generated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
                            Download
                          </Button>
                          <Button variant="outline" size="sm" leftIcon={<ExternalLink size={16} />}>
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No reports generated</h3>
                  <p className="text-neutral-500 mb-4">Generate treasury and governance reports</p>
                  <Button leftIcon={<FileText size={18} />}>
                    Generate Your First Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Keys Tab */}
          {activeTab === 'keys' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">Cryptographic Keys</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" leftIcon={<Shield size={18} />}>
                    Security Audit
                  </Button>
                  <Button leftIcon={<Plus size={18} />}>
                    Add Key
                  </Button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-warning-800">Important Security Notice</h3>
                    <div className="mt-2 text-sm text-warning-700">
                      <p>
                        Never share your private keys or seed phrases. Always verify hardware wallet authenticity and keep firmware updated.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockKeys.map((key) => (
                  <div key={key.id} className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Fingerprint:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-neutral-900">{key.fingerprint}</span>
                          <button
                            onClick={() => copyToClipboard(key.fingerprint, 'key')}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors"
                          >
                            {copiedKey === key.fingerprint ? (
                              <Check size={14} className="text-success-600" />
                            ) : (
                              <Copy size={14} className="text-neutral-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Last Used:</span>
                        <span className="text-sm text-neutral-900">{key.lastUsed}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-neutral-200">
                        <Button variant="outline" size="sm" fullWidth>
                          Test Key
                        </Button>
                      </div>
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