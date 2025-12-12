'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApplication, useTradingStatus } from '@/contexts/ApplicationContext';

export function TradingManagerTab() {
  const { executeTrade } = useApplication();
  const tradingStatus = useTradingStatus();
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [showSettlementBadge, setShowSettlementBadge] = useState<boolean>(false);

  const handleExecuteTrade = () => {
    const amount = parseFloat(sellAmount);
    if (amount > 0 && buyerName.trim()) {
      executeTrade(amount, buyerName.trim());
      setSellAmount('');
      setBuyerName('');
      setShowSettlementBadge(true);
      
      // Hide settlement badge after 5 seconds
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">
            Trading Manager
          </CardTitle>
          <p className="text-slate-600">
            Manage syndicate member allocations and execute instant trades
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Allocations Table */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Current Lender Allocations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 px-4 py-2 text-left font-medium text-slate-900">
                      Lender Name
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-right font-medium text-slate-900">
                      Amount
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-right font-medium text-slate-900">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody data-testid="lender-allocations-table">
                  {tradingStatus.lenderAllocations.map((lender, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors duration-200">
                      <td className="border border-slate-300 px-4 py-2 text-slate-900">
                        {lender.lenderName}
                      </td>
                      <td className="border border-slate-300 px-4 py-2 text-right text-slate-900">
                        {formatCurrency(lender.amount)}
                      </td>
                      <td className="border border-slate-300 px-4 py-2 text-right text-slate-900">
                        {formatPercentage(lender.percentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Total Facility Amount */}
            <div className="mt-4 p-4 bg-slate-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">Total Facility Amount:</span>
                <span className="font-semibold text-slate-900" data-testid="total-facility-amount">
                  {formatCurrency(tradingStatus.totalFacilityAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Trade Execution Form */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Execute Trade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="sell-amount" className="block text-sm font-medium text-slate-700 mb-2">
                  Sell Amount (USD)
                </label>
                <Input
                  id="sell-amount"
                  type="number"
                  placeholder="Enter amount to sell"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  data-testid="sell-amount-input"
                  min="0"
                  step="1000000"
                />
              </div>
              <div>
                <label htmlFor="buyer-name" className="block text-sm font-medium text-slate-700 mb-2">
                  Buyer Name
                </label>
                <Input
                  id="buyer-name"
                  type="text"
                  placeholder="Enter buyer name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  data-testid="buyer-name-input"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleExecuteTrade}
                  disabled={isExecuteDisabled}
                  className="w-full transition-all duration-200 hover:scale-105"
                  data-testid="execute-trade-button"
                >
                  Execute Trade
                </Button>
              </div>
            </div>
          </div>

          {/* Settlement Badge */}
          {showSettlementBadge && (
            <div className="flex justify-center animate-fade-in">
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 px-4 py-2 animate-pulse-success"
                data-testid="settlement-badge"
              >
                Settlement Time: T+0 (Instant)
              </Badge>
            </div>
          )}

          {/* Last Trade Information */}
          {tradingStatus.lastTradeTimestamp && (
            <div className="text-sm text-slate-600">
              Last trade executed: {tradingStatus.lastTradeTimestamp.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}