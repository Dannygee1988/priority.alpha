import React, { useState, useEffect } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, DollarSign, PieChart, FileText, Users, Download, Plus, Search, Filter, Eye, MoreVertical, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, BarChart3, Calendar, Globe, Shield, AlertTriangle, CheckCircle, Wand2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import {
  getCryptoHoldings,
  getCryptoTransactions,
  getCustomerCryptoPayments,
  getTreasuryReports,
  generateTreasuryReport,
  type CryptoHolding,
  type CryptoTransaction,
  type CustomerCryptoPayment,
  type TreasuryReport
} from '../lib/crypto-api';

const Pr1Bit: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions' | 'payments' | 'reports'>('portfolio');
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerCryptoPayment[]>([]);
  const [treasuryReports, setTreasuryReports] = useState<TreasuryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'treasury' | 'governance' | 'tax' | 'risk' | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

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
      setTreasuryReports(reportsData);
    } catch (err) {
      console.error('Error loading crypto data:', err);
      setError('Failed to load crypto data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + (holding.value || 0), 0);
  const totalChange24h = holdings.reduce((sum, holding) => {
    const changeValue = (holding.value || 0) * (holding.change_24h || 0) / 100;
    return sum + changeValue;
  }, 0);
  const totalChangePercent = totalPortfolioValue > 0 ? (totalChange24h / totalPortfolioValue) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatCrypto = (amount: number, symbol: string) => {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${symbol}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-success-50 text-success-700';
      case 'pending':
        return 'bg-warning-50 text-warning-700';
      case 'failed':
        return 'bg-error-50 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <ArrowDownRight size={16} className="text-success-600" />;
      case 'sell':
        return <ArrowUpRight size={16} className="text-error-600" />;
      case 'receive':
        return <ArrowDownRight size={16} className="text-primary" />;
      case 'send':
        return <ArrowUpRight size={16} className="text-warning-600" />;
      default:
        return <DollarSign size={16} />;
    }
  };

  const handleGenerateReport = async (type: 'treasury' | 'governance' | 'tax' | 'risk') => {
    if (!user?.id) return;

    setIsGenerating(type);
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Generate mock report content
      const reportTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`;
      const reportContent = `This is a generated ${type} report for your cryptocurrency treasury. 

Portfolio Summary:
- Total Holdings: ${holdings.length} cryptocurrencies
- Total Value: ${formatCurrency(totalPortfolioValue)}
- 24h Change: ${totalChangePercent.toFixed(2)}%

Generated on: ${new Date().toISOString()}`;

      const newReport = await generateTreasuryReport(companyId, type, reportTitle, reportContent);
      setTreasuryReports([newReport, ...treasuryReports]);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleViewReports = (type: 'treasury' | 'governance' | 'tax' | 'risk') => {
    setSelectedReportType(type);
    setShowReportsModal(true);
  };

  const getReportsByType = (type: 'treasury' | 'governance' | 'tax' | 'risk') => {
    return treasuryReports.filter(report => report.report_type === type);
  };

  const getReportTypeTitle = (type: 'treasury' | 'governance' | 'tax' | 'risk') => {
    switch (type) {
      case 'treasury': return 'Treasury Reports';
      case 'governance': return 'Governance Documents';
      case 'tax': return 'Tax Reports';
      case 'risk': return 'Risk Assessments';
      default: return 'Reports';
    }
  };

  const filteredHoldings = holdings.filter(holding =>
    holding.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    holding.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 flex items-center">
              <Bitcoin className="mr-3 text-orange-500" size={32} />
              Pr1Bit Treasury
            </h1>
            <p className="text-neutral-500">Manage your company's cryptocurrency treasury and payments</p>
          </div>
          <div className="flex space-x-3">
            <Button
              leftIcon={<Plus size={18} />}
              onClick={() => setShowBuyModal(true)}
            >
              Buy Crypto
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-md">
          {error}
        </div>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Portfolio Value</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(totalPortfolioValue)}
              </h3>
            </div>
            <Wallet size={24} className="text-orange-200" />
          </div>
          <div className="flex items-center">
            {totalChangePercent >= 0 ? (
              <TrendingUp size={16} className="mr-1 text-green-300" />
            ) : (
              <TrendingDown size={16} className="mr-1 text-red-300" />
            )}
            <span className={`text-sm font-medium ${totalChangePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}% (24h)
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Active Holdings</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {holdings.length}
              </h3>
            </div>
            <PieChart size={24} className="text-primary" />
          </div>
          <p className="text-sm text-neutral-500">Across {holdings.length} cryptocurrencies</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Customer Payments</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {customerPayments.length}
              </h3>
            </div>
            <CreditCard size={24} className="text-success-500" />
          </div>
          <p className="text-sm text-neutral-500">This month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Transactions</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {transactions.length}
              </h3>
            </div>
            <BarChart3 size={24} className="text-accent" />
          </div>
          <p className="text-sm text-neutral-500">All time</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200">
          <div className="flex">
            {[
              { id: 'portfolio', label: 'Portfolio', icon: PieChart },
              { id: 'transactions', label: 'Transactions', icon: BarChart3 },
              { id: 'payments', label: 'Customer Payments', icon: CreditCard },
              { id: 'reports', label: 'Reports & Governance', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-800">Holdings</h2>
              <Input
                placeholder="Search holdings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                className="w-64"
              />
            </div>

            {filteredHoldings.length > 0 ? (
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
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHoldings.map((holding) => (
                      <tr key={holding.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                              <span className="text-orange-600 font-bold text-sm">{holding.symbol}</span>
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900">{holding.name}</div>
                              <div className="text-sm text-neutral-500">{holding.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatCrypto(holding.amount, holding.symbol)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatCurrency(holding.current_price || 0)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatCurrency(holding.value || 0)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {(holding.change_24h || 0) >= 0 ? (
                              <TrendingUp size={16} className="mr-1 text-success-500" />
                            ) : (
                              <TrendingDown size={16} className="mr-1 text-error-500" />
                            )}
                            <span className={`font-medium ${(holding.change_24h || 0) >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                              {(holding.change_24h || 0) >= 0 ? '+' : ''}{(holding.change_24h || 0).toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-neutral-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${holding.allocation || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{(holding.allocation || 0).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bitcoin className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Holdings Found</h3>
                <p className="text-neutral-500 mb-4">
                  {searchQuery ? 'No holdings match your search criteria' : 'Start building your crypto treasury'}
                </p>
                <Button leftIcon={<Plus size={18} />} onClick={() => setShowBuyModal(true)}>
                  Buy Crypto
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-800">Transaction History</h2>
              <div className="flex space-x-2">
                <Button variant="outline" leftIcon={<Calendar size={18} />}>
                  Date Range
                </Button>
                <Button variant="outline" leftIcon={<Download size={18} />}>
                  Export
                </Button>
              </div>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-4 border border-neutral-200">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-neutral-900 capitalize">{transaction.type}</span>
                            <span className="mx-2 text-neutral-400">•</span>
                            <span className="text-neutral-600">{transaction.symbol}</span>
                          </div>
                          <div className="text-sm text-neutral-500">{formatDate(transaction.created_at)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-neutral-900">
                          {formatCrypto(transaction.amount, transaction.symbol)}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {formatCurrency(transaction.value)}
                        </div>
                      </div>
                      <div className="flex items-center ml-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                        {transaction.tx_hash && (
                          <Button variant="ghost" size="sm" className="ml-2">
                            <Globe size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Transactions</h3>
                <p className="text-neutral-500">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Payments Tab */}
        {activeTab === 'payments' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-800">Customer Payments</h2>
              <div className="flex space-x-2">
                <Input
                  placeholder="Search payments..."
                  leftIcon={<Search size={18} />}
                  className="w-64"
                />
                <Button variant="outline" size="sm" leftIcon={<Filter size={16} />}>
                  Filter
                </Button>
              </div>
            </div>

            {customerPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Value</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Confirmations</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <Users size={16} className="text-primary" />
                            </div>
                            <div>
                              <span className="font-medium text-neutral-900">{payment.customer_name}</span>
                              {payment.customer_email && (
                                <div className="text-sm text-neutral-500">{payment.customer_email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatCrypto(payment.amount, payment.symbol)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatCurrency(payment.value_gbp)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600">{formatDate(payment.created_at)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {payment.status === 'confirmed' ? (
                              <CheckCircle size={16} className="text-success-500 mr-1" />
                            ) : (
                              <AlertTriangle size={16} className="text-warning-500 mr-1" />
                            )}
                            <span className="text-sm">{payment.confirmations}/6</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" leftIcon={<Eye size={16} />}>
                              View
                            </Button>
                            <Button variant="ghost" size="sm" leftIcon={<Globe size={16} />}>
                              Explorer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Customer Payments</h3>
                <p className="text-neutral-500">Customer crypto payments will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Treasury Report</h3>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText size={24} className="text-primary" />
                  </div>
                </div>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  Generate comprehensive treasury reports for board meetings and compliance.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Wand2 size={16} />}
                    onClick={() => handleGenerateReport('treasury')}
                    isLoading={isGenerating === 'treasury'}
                    disabled={isGenerating === 'treasury'}
                  >
                    {isGenerating === 'treasury' ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Eye size={16} />}
                    onClick={() => handleViewReports('treasury')}
                  >
                    View
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Governance Documents</h3>
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <Shield size={24} className="text-neutral-600" />
                  </div>
                </div>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  Create governance documents and policy frameworks for cryptocurrency holdings.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Wand2 size={16} />}
                    onClick={() => handleGenerateReport('governance')}
                    isLoading={isGenerating === 'governance'}
                    disabled={isGenerating === 'governance'}
                  >
                    {isGenerating === 'governance' ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Eye size={16} />}
                    onClick={() => handleViewReports('governance')}
                  >
                    View
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Tax Reports</h3>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Calendar size={24} className="text-accent-600" />
                  </div>
                </div>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  Generate tax reports and capital gains calculations for regulatory compliance.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Wand2 size={16} />}
                    onClick={() => handleGenerateReport('tax')}
                    isLoading={isGenerating === 'tax'}
                    disabled={isGenerating === 'tax'}
                  >
                    {isGenerating === 'tax' ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Eye size={16} />}
                    onClick={() => handleViewReports('tax')}
                  >
                    View
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Risk Assessment</h3>
                  <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
                    <AlertTriangle size={24} className="text-warning-600" />
                  </div>
                </div>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  Analyze portfolio risk and generate risk management recommendations.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Wand2 size={16} />}
                    onClick={() => handleGenerateReport('risk')}
                    isLoading={isGenerating === 'risk'}
                    disabled={isGenerating === 'risk'}
                  >
                    {isGenerating === 'risk' ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    leftIcon={<Eye size={16} />}
                    onClick={() => handleViewReports('risk')}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buy Crypto Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Buy Cryptocurrency</h2>
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <MoreVertical size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Cryptocurrency
                  </label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select cryptocurrency...</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="ADA">Cardano (ADA)</option>
                    <option value="SOL">Solana (SOL)</option>
                  </select>
                </div>

                <Input
                  label="Amount (GBP)"
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.00"
                  leftIcon={<DollarSign size={18} />}
                  fullWidth
                />

                <div className="bg-neutral-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Estimated Amount:</span>
                    <span className="font-medium">0.0234 {selectedCrypto || 'BTC'}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-neutral-600">Network Fee:</span>
                    <span className="font-medium">£2.50</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBuyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!selectedCrypto || !buyAmount}
                  leftIcon={<Bitcoin size={18} />}
                >
                  Buy Crypto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Reports Modal */}
      {showReportsModal && selectedReportType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-neutral-800">
                  {getReportTypeTitle(selectedReportType)}
                </h2>
                <button
                  onClick={() => {
                    setShowReportsModal(false);
                    setSelectedReportType(null);
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <MoreVertical size={20} className="text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {getReportsByType(selectedReportType).length > 0 ? (
                <div className="space-y-4">
                  {getReportsByType(selectedReportType).map((report) => (
                    <div key={report.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-neutral-900">{report.title}</h3>
                          <p className="text-sm text-neutral-500">
                            Generated on {formatDate(report.generated_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                            completed
                          </span>
                          <Button variant="ghost" size="sm" leftIcon={<Download size={16} />}>
                            Download
                          </Button>
                          <Button variant="ghost" size="sm" leftIcon={<Eye size={16} />}>
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
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    No {getReportTypeTitle(selectedReportType)} Found
                  </h3>
                  <p className="text-neutral-500 mb-4">
                    You haven't generated any {selectedReportType} reports yet.
                  </p>
                  <Button
                    leftIcon={<Wand2 size={18} />}
                    onClick={() => {
                      setShowReportsModal(false);
                      setSelectedReportType(null);
                      handleGenerateReport(selectedReportType);
                    }}
                  >
                    Generate First Report
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportsModal(false);
                  setSelectedReportType(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pr1Bit;