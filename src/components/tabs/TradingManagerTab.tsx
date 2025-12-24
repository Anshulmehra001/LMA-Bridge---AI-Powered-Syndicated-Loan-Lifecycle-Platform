'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TradingClock } from '@/components/ui/dynamic-clock';
import { useApplication, useTradingStatus, useLoanData } from '@/contexts/ApplicationContext';
import { TrendingUp, Users, DollarSign, Clock, CheckCircle, AlertCircle, BarChart3, PieChart } from 'lucide-react';

export function TradingManagerTab() {
  const { executeTrade } = useApplication();
  const tradingStatus = useTradingStatus();
  const loanData = useLoanData();
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [showSettlementBadge, setShowSettlementBadge] = useState<boolean>(false);
  const [tradeHistory, setTradeHistory] = useState<Array<{
    timestamp: Date;
    sellAmount: number;
    buyerName: string;
    status: 'completed' | 'pending';
  }>>([]);
  const [marketData, setMarketData] = useState({
    avgPrice: 98.5,
    spread: 0.25,
    volume24h: 125000000,
    lastTrade: new Date()
  });

  // Update market data periodically for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        avgPrice: prev.avgPrice + (Math.random() - 0.5) * 0.1,
        spread: Math.max(0.1, prev.spread + (Math.random() - 0.5) * 0.05),
        lastTrade: new Date()
      }));
    }, 5000); // Update every 5 seconds for more dynamic feel

    return () => clearInterval(interval);
  }, []);

  const handleExecuteTrade = () => {
    const amount = parseFloat(sellAmount);
    if (amount > 0 && buyerName.trim()) {
      executeTrade(amount, buyerName.trim());
      
      // Add to trade history
      setTradeHistory(prev => [{
        timestamp: new Date(),
        sellAmount: amount,
        buyerName: buyerName.trim(),
        status: 'completed'
      }, ...prev.slice(0, 9)]); // Keep last 10 trades
      
      setSellAmount('');
      setBuyerName('');
      setShowSettlementBadge(true);
      
      setTimeout(() => {
        setShowSettlementBadge(false);
      }, 5000);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  const isExecuteDisabled = !sellAmount || !buyerName.trim() || parseFloat(sellAmount) <= 0;

  // Calculate portfolio metrics
  const totalParticipants = tradingStatus.lenderAllocations.length;
  const largestAllocation = Math.max(...tradingStatus.lenderAllocations.map(l => l.percentage));
  const concentrationRisk = largestAllocation > 40 ? 'High' : largestAllocation > 25 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
            Trading Manager
          </h2>
          <p className="text-slate-600 mt-2 text-lg">Manage syndicate allocations and execute secondary market trades</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-lg">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Market Price</p>
            <p className="text-2xl font-bold text-green-600">{marketData.avgPrice.toFixed(2)}</p>
          </div>
          <div className="text-right bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-lg">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Spread</p>
            <p className="text-xl font-bold text-blue-600">{marketData.spread.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Facility</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {formatCurrency(tradingStatus.totalFacilityAmount)}
                </p>
              </div>
              <div className="bg-green-500 p-4 rounded-full">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Participants</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">{totalParticipants}</p>
              </div>
              <div className="bg-blue-500 p-4 rounded-full">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">24h Volume</p>
                <p className="text-3xl font-bold text-purple-700 mt-2">
                  {formatCurrency(marketData.volume24h)}
                </p>
              </div>
              <div className="bg-purple-500 p-4 rounded-full">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Concentration Risk</p>
                <p className={`text-3xl font-bold mt-2 ${
                  concentrationRisk === 'High' ? 'text-red-600' : 
                  concentrationRisk === 'Medium' ? 'text-yellow-600' : 'text-indigo-700'
                }`}>
                  {concentrationRisk}
                </p>
              </div>
              <div className="bg-indigo-500 p-4 rounded-full">
                <PieChart className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Allocations */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-slate-800">Current Syndicate Allocations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-lg">Lender Name</th>
                  <th className="text-right py-4 px-6 font-bold text-slate-700 text-lg">Amount</th>
                  <th className="text-right py-4 px-6 font-bold text-slate-700 text-lg">Percentage</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700 text-lg">Status</th>
                </tr>
              </thead>
              <tbody data-testid="lender-allocations-table">
                {tradingStatus.lenderAllocations.map((lender, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-25 transition-all duration-200">
                    <td className="py-6 px-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                          index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                          index === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
                        }`}></div>
                        <span className="font-semibold text-slate-900 text-lg">{lender.lenderName}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right font-bold text-slate-900 text-lg">
                      {formatCurrency(lender.amount)}
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <span className="font-bold text-slate-900 text-lg">
                          {formatPercentage(lender.percentage)}
                        </span>
                        <div className="w-20 bg-slate-200 rounded-full h-3 shadow-inner">
                          <div 
                            className={`h-3 rounded-full shadow-sm ${
                              index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                              index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                              index === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
                            }`}
                            style={{ width: `${Math.min(100, lender.percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <Badge variant="default" className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 font-semibold shadow-lg">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Total Summary */}
          <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-slate-900">Total Facility Amount:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent" data-testid="total-facility-amount">
                {formatCurrency(tradingStatus.totalFacilityAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Execution */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-slate-800">Execute Secondary Market Trade</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-500 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-blue-800 text-lg">Market Information</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="bg-white rounded-lg p-4 shadow-md">
                <span className="text-blue-700 font-semibold">Current Price:</span>
                <p className="font-bold text-blue-900 text-xl">{marketData.avgPrice.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <span className="text-blue-700 font-semibold">Bid-Ask Spread:</span>
                <p className="font-bold text-blue-900 text-xl">{marketData.spread.toFixed(2)}%</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <span className="text-blue-700 font-semibold">Settlement:</span>
                <p className="font-bold text-blue-900 text-xl">T+0 (Instant)</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <span className="text-blue-700 font-semibold">Last Update:</span>
                <div className="font-bold text-blue-900 text-xl">
                  <TradingClock className="text-blue-900 text-xl font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label htmlFor="sell-amount" className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                Trade Amount (USD)
              </label>
              <Input
                id="sell-amount"
                type="number"
                placeholder="Enter amount to trade"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                data-testid="sell-amount-input"
                min="0"
                step="1000000"
                className="text-lg p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">Minimum: $1,000,000</p>
            </div>
            <div>
              <label htmlFor="buyer-name" className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                Counterparty Name
              </label>
              <Input
                id="buyer-name"
                type="text"
                placeholder="Enter counterparty name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                data-testid="buyer-name-input"
                className="text-lg p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">New or existing syndicate member</p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleExecuteTrade}
                disabled={isExecuteDisabled}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg py-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                data-testid="execute-trade-button"
              >
                <TrendingUp className="w-6 h-6 mr-3" />
                Execute Trade
              </Button>
            </div>
          </div>

          {/* Trade Preview */}
          {sellAmount && buyerName && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 shadow-inner animate-fade-in">
              <h4 className="font-bold text-slate-700 mb-4 text-lg">Trade Preview</h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <span className="text-slate-600 font-semibold">Trade Amount:</span>
                  <p className="font-bold text-slate-900 text-xl">{formatCurrency(parseFloat(sellAmount) || 0)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <span className="text-slate-600 font-semibold">Estimated Price:</span>
                  <p className="font-bold text-slate-900 text-xl">{marketData.avgPrice.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <span className="text-slate-600 font-semibold">Settlement:</span>
                  <p className="font-bold text-green-600 text-xl">Instant (T+0)</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <span className="text-slate-600 font-semibold">Fees:</span>
                  <p className="font-bold text-slate-900 text-xl">$0 (No fees)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Status */}
      {showSettlementBadge && (
        <div className="flex justify-center animate-fade-in">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 flex items-center space-x-4 shadow-xl">
            <div className="bg-green-500 p-3 rounded-full">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-green-800 text-xl">Trade Executed Successfully</p>
              <p className="text-sm text-green-700 mt-1">Settlement completed instantly (T+0)</p>
            </div>
          </div>
        </div>
      )}

      {/* Trade History */}
      {tradeHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-6 h-6" />
              <span>Recent Trade Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tradeHistory.map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Trade with {trade.buyerName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {trade.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {formatCurrency(trade.sellAmount)}
                    </p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {trade.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Trade Information */}
      {tradingStatus.lastTradeTimestamp && (
        <div className="text-center text-sm text-slate-600">
          Last syndicate update: {tradingStatus.lastTradeTimestamp.toLocaleString()}
        </div>
      )}
    </div>
  );
}