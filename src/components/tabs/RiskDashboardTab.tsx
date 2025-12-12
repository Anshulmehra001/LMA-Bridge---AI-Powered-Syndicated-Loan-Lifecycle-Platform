'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useApplication, useRiskStatus, useLoanData } from '@/contexts/ApplicationContext';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RiskDashboardTab() {
  const { updateCurrentLeverage } = useApplication();
  const riskStatus = useRiskStatus();
  const loanData = useLoanData();
  const [currentLeverageValue, setCurrentLeverageValue] = useState<number[]>([0]);

  // Initialize slider value when loan data is available
  useEffect(() => {
    if (loanData && riskStatus.currentLeverage === 0) {
      // Set initial value to a safe level (80% of covenant)
      const initialValue = loanData.leverageCovenant * 0.8;
      setCurrentLeverageValue([initialValue]);
      updateCurrentLeverage(initialValue);
    }
  }, [loanData, riskStatus.currentLeverage, updateCurrentLeverage]);

  // Sync slider with risk status changes
  useEffect(() => {
    if (riskStatus.currentLeverage > 0 && currentLeverageValue[0] !== riskStatus.currentLeverage) {
      setCurrentLeverageValue([riskStatus.currentLeverage]);
    }
  }, [riskStatus.currentLeverage, currentLeverageValue]);

  const handleLeverageChange = (value: number[]) => {
    const newLeverage = value[0];
    setCurrentLeverageValue(value);
    updateCurrentLeverage(newLeverage);
  };

  const leverageCovenant = loanData?.leverageCovenant || 0;
  const currentLeverage = currentLeverageValue[0];
  const isBreached = currentLeverage > leverageCovenant;
  const isWarning = currentLeverage > leverageCovenant * 0.9 && !isBreached;

  // Determine card styling based on risk status
  const cardClassName = cn(
    "transition-colors duration-300",
    {
      "border-red-500 bg-red-50": isBreached,
      "border-yellow-500 bg-yellow-50": isWarning,
      "border-slate-200": !isBreached && !isWarning,
    }
  );

  const titleClassName = cn(
    "text-lg font-medium flex items-center justify-between",
    {
      "text-red-800": isBreached,
      "text-yellow-800": isWarning,
      "text-slate-900": !isBreached && !isWarning,
    }
  );

  return (
    <div className="space-y-6">
      {/* Covenant Breach Warning Banner */}
      {isBreached && (
        <div className="bg-red-100 border border-red-300 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-red-800">
                EVENT OF DEFAULT WARNING
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Current leverage ({currentLeverage.toFixed(2)}x) exceeds the covenant threshold ({leverageCovenant.toFixed(2)}x).
                Immediate action required to avoid default.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Dashboard Card */}
      <Card className={cardClassName}>
        <CardHeader>
          <CardTitle className={titleClassName}>
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Risk Dashboard
            </div>
            {isBreached && (
              <Badge variant="destructive" className="bg-red-600 text-white">
                BREACH
              </Badge>
            )}
            {isWarning && !isBreached && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                WARNING
              </Badge>
            )}
            {!isBreached && !isWarning && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                SAFE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Leverage Covenant Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-md">
                <h4 className="font-medium text-slate-700 mb-2">Leverage Covenant</h4>
                <p className="text-2xl font-bold text-slate-900">
                  {leverageCovenant.toFixed(2)}x
                </p>
                <p className="text-sm text-slate-600 mt-1">Maximum allowed</p>
              </div>
              <div className={cn(
                "p-4 rounded-md",
                {
                  "bg-red-100": isBreached,
                  "bg-yellow-100": isWarning,
                  "bg-green-100": !isBreached && !isWarning,
                }
              )}>
                <h4 className={cn(
                  "font-medium mb-2",
                  {
                    "text-red-700": isBreached,
                    "text-yellow-700": isWarning,
                    "text-green-700": !isBreached && !isWarning,
                  }
                )}>Current Leverage</h4>
                <p className={cn(
                  "text-2xl font-bold",
                  {
                    "text-red-800": isBreached,
                    "text-yellow-800": isWarning,
                    "text-green-800": !isBreached && !isWarning,
                  }
                )}>
                  {currentLeverage.toFixed(2)}x
                </p>
                <p className={cn(
                  "text-sm mt-1",
                  {
                    "text-red-600": isBreached,
                    "text-yellow-600": isWarning,
                    "text-green-600": !isBreached && !isWarning,
                  }
                )}>
                  {isBreached ? 'EXCEEDS COVENANT' : isWarning ? 'Approaching limit' : 'Within covenant'}
                </p>
              </div>
            </div>

            {/* Current Leverage Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-700">Adjust Current Leverage</h4>
                <span className="text-sm text-slate-600">
                  {currentLeverage.toFixed(2)}x
                </span>
              </div>
              
              <div className="space-y-2">
                <Slider
                  value={currentLeverageValue}
                  onValueChange={handleLeverageChange}
                  min={0.1}
                  max={Math.max(10, leverageCovenant * 2)} // Allow testing beyond covenant
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0.1x</span>
                  <span className="font-medium">Covenant: {leverageCovenant.toFixed(1)}x</span>
                  <span>{Math.max(10, leverageCovenant * 2).toFixed(1)}x</span>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="font-medium text-slate-700 mb-3">Risk Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Covenant Utilization:</span>
                  <p className={cn(
                    "font-semibold",
                    {
                      "text-red-600": isBreached,
                      "text-yellow-600": isWarning,
                      "text-green-600": !isBreached && !isWarning,
                    }
                  )}>
                    {leverageCovenant > 0 ? ((currentLeverage / leverageCovenant) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Headroom:</span>
                  <p className={cn(
                    "font-semibold",
                    {
                      "text-red-600": isBreached,
                      "text-yellow-600": isWarning,
                      "text-green-600": !isBreached && !isWarning,
                    }
                  )}>
                    {leverageCovenant > 0 ? Math.max(0, leverageCovenant - currentLeverage).toFixed(2) : 0}x
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Status:</span>
                  <p className={cn(
                    "font-semibold",
                    {
                      "text-red-600": isBreached,
                      "text-yellow-600": isWarning,
                      "text-green-600": !isBreached && !isWarning,
                    }
                  )}>
                    {isBreached ? 'BREACH' : isWarning ? 'WARNING' : 'SAFE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {loanData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-900">
              Loan Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Borrower:</span>
                <p className="text-slate-900">{loanData.borrowerName}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Facility Amount:</span>
                <p className="text-slate-900">
                  {loanData.currency} {loanData.facilityAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Interest Rate Margin:</span>
                <p className="text-slate-900">{loanData.interestRateMargin}%</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">ESG Target:</span>
                <p className="text-slate-900">{loanData.esgTarget}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}