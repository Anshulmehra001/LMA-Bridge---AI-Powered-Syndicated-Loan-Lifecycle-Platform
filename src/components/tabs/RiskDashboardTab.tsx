'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TradingClock } from '@/components/ui/dynamic-clock';
import { useApplication, useRiskStatus, useLoanData } from '@/contexts/ApplicationContext';
import { AlertTriangle, TrendingUp, Shield, Activity, BarChart3, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RiskDashboardTab() {
  const { updateCurrentLeverage } = useApplication();
  const riskStatus = useRiskStatus();
  const loanData = useLoanData();
  const [currentLeverageValue, setCurrentLeverageValue] = useState<number[]>([0]);
  const [riskHistory, setRiskHistory] = useState<Array<{timestamp: Date, leverage: number, status: string}>>([]);
  const [alertsCount, setAlertsCount] = useState(0);

  // Initialize slider value when loan data is available
  useEffect(() => {
    if (loanData && riskStatus.currentLeverage === 0) {
      const initialValue = loanData.leverageCovenant * 0.8;
      setCurrentLeverageValue(prev => prev[0] !== initialValue ? [initialValue] : prev);
      updateCurrentLeverage(initialValue);
    }
  }, [loanData, riskStatus.currentLeverage, updateCurrentLeverage]);

  // Sync slider with risk status changes
  useEffect(() => {
    if (riskStatus.currentLeverage > 0 && currentLeverageValue[0] !== riskStatus.currentLeverage) {
      setCurrentLeverageValue(prev => 
        prev[0] !== riskStatus.currentLeverage ? [riskStatus.currentLeverage] : prev
      );
    }
  }, [riskStatus.currentLeverage, currentLeverageValue]);

  // Track risk history
  useEffect(() => {
    if (riskStatus.currentLeverage > 0) {
      setRiskHistory(prev => {
        const newEntry = {
          timestamp: new Date(),
          leverage: riskStatus.currentLeverage,
          status: riskStatus.warningLevel
        };
        return [...prev.slice(-9), newEntry]; // Keep last 10 entries
      });
    }
  }, [riskStatus.currentLeverage, riskStatus.warningLevel]);

  // Count alerts
  useEffect(() => {
    const breachCount = riskHistory.filter(entry => entry.status === 'breach').length;
    const warningCount = riskHistory.filter(entry => entry.status === 'warning').length;
    setAlertsCount(breachCount + warningCount);
  }, [riskHistory]);

  const handleLeverageChange = (value: number[]) => {
    const newLeverage = value[0];
    setCurrentLeverageValue(value);
    updateCurrentLeverage(newLeverage);
  };

  const leverageCovenant = loanData?.leverageCovenant || 0;
  const currentLeverage = currentLeverageValue[0];
  const isBreached = currentLeverage > leverageCovenant;
  const isWarning = currentLeverage > leverageCovenant * 0.9 && !isBreached;

  // Calculate risk metrics
  const covenantUtilization = leverageCovenant > 0 ? (currentLeverage / leverageCovenant) * 100 : 0;
  const headroom = leverageCovenant > 0 ? Math.max(0, leverageCovenant - currentLeverage) : 0;
  const riskScore = Math.min(100, covenantUtilization);

  // Get risk level color and icon
  const getRiskLevel = () => {
    if (isBreached) return { level: 'HIGH', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle };
    if (isWarning) return { level: 'MEDIUM', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    return { level: 'LOW', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
  };

  const riskLevel = getRiskLevel();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Risk Dashboard
          </h2>
          <p className="text-slate-600 mt-2 text-lg">Monitor covenant compliance and risk metrics in real-time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${riskLevel.bgColor}`}>
            <div className="flex items-center space-x-3">
              <riskLevel.icon className={`w-6 h-6 ${riskLevel.color}`} />
              <span className={`font-bold text-lg ${riskLevel.color}`}>
                Risk Level: {riskLevel.level}
              </span>
            </div>
          </div>
          {alertsCount > 0 && (
            <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
              {alertsCount} Alert{alertsCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Covenant Breach Warning Banner */}
      {isBreached && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-8 shadow-xl animate-pulse-success">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-full mr-6">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-red-800 mb-2">
                COVENANT BREACH DETECTED
              </h3>
              <p className="text-red-700 text-lg leading-relaxed">
                Current leverage ratio ({currentLeverage.toFixed(2)}x) exceeds the covenant threshold ({leverageCovenant.toFixed(2)}x).
                Immediate remedial action required to avoid event of default.
              </p>
              <div className="mt-6 flex space-x-4">
                <Button variant="destructive" size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Generate Alert Report
                </Button>
                <Button variant="outline" size="lg" className="border-red-300 text-red-700 hover:bg-red-50 shadow-lg">
                  <Clock className="w-5 h-5 mr-2" />
                  Schedule Review Meeting
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={cn("transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg", {
          "bg-gradient-to-br from-red-50 to-red-100 shadow-red-200": isBreached,
          "bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-yellow-200": isWarning,
          "bg-gradient-to-br from-green-50 to-green-100 shadow-green-200": !isBreached && !isWarning,
        })}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Current Leverage</p>
                <p className={cn("text-4xl font-bold mt-2", {
                  "text-red-700": isBreached,
                  "text-yellow-700": isWarning,
                  "text-green-700": !isBreached && !isWarning,
                })}>
                  {currentLeverage.toFixed(2)}x
                </p>
              </div>
              <div className={cn("p-4 rounded-full", {
                "bg-red-500": isBreached,
                "bg-yellow-500": isWarning,
                "bg-green-500": !isBreached && !isWarning,
              })}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Covenant Limit</p>
                <p className="text-4xl font-bold text-blue-700 mt-2">
                  {leverageCovenant.toFixed(2)}x
                </p>
              </div>
              <div className="bg-blue-500 p-4 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Utilization</p>
                <p className={cn("text-4xl font-bold mt-2", {
                  "text-red-700": covenantUtilization > 100,
                  "text-yellow-700": covenantUtilization > 90,
                  "text-purple-700": covenantUtilization <= 90,
                })}>
                  {covenantUtilization.toFixed(1)}%
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
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Headroom</p>
                <p className={cn("text-4xl font-bold mt-2", {
                  "text-red-700": headroom <= 0,
                  "text-yellow-700": headroom <= leverageCovenant * 0.1,
                  "text-indigo-700": headroom > leverageCovenant * 0.1,
                })}>
                  {headroom.toFixed(2)}x
                </p>
              </div>
              <div className="bg-indigo-500 p-4 rounded-full">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Risk Simulation */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-slate-800">Risk Simulation & Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          {/* Leverage Slider */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg text-slate-700">Current Leverage Ratio</h4>
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  {currentLeverage.toFixed(2)}x
                </span>
                <Badge variant={isBreached ? "destructive" : isWarning ? "secondary" : "default"} 
                       className={cn("px-4 py-2 font-semibold", {
                         "bg-gradient-to-r from-red-500 to-red-600 text-white": isBreached,
                         "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white": isWarning,
                         "bg-gradient-to-r from-green-500 to-green-600 text-white": !isBreached && !isWarning,
                       })}>
                  {isBreached ? 'BREACH' : isWarning ? 'WARNING' : 'SAFE'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <Slider
                value={currentLeverageValue}
                onValueChange={handleLeverageChange}
                min={0.1}
                max={Math.max(10, leverageCovenant * 2)}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-500">
                <span className="font-medium">0.1x</span>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-700 text-base">Covenant: {leverageCovenant.toFixed(1)}x</span>
                  <div className="w-px h-6 bg-slate-400 mt-2"></div>
                </div>
                <span className="font-medium">{Math.max(10, leverageCovenant * 2).toFixed(1)}x</span>
              </div>
            </div>
          </div>

          {/* Risk Metrics Table */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 shadow-inner">
            <h4 className="font-bold text-lg text-slate-700 mb-6">Risk Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <span className="text-slate-600 font-medium">Covenant Utilization:</span>
                <p className={cn("font-bold text-2xl mt-2", {
                  "text-red-600": covenantUtilization > 100,
                  "text-yellow-600": covenantUtilization > 90,
                  "text-green-600": covenantUtilization <= 90,
                })}>
                  {covenantUtilization.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <span className="text-slate-600 font-medium">Available Headroom:</span>
                <p className={cn("font-bold text-2xl mt-2", {
                  "text-red-600": headroom <= 0,
                  "text-yellow-600": headroom <= leverageCovenant * 0.1,
                  "text-green-600": headroom > leverageCovenant * 0.1,
                })}>
                  {headroom.toFixed(2)}x
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <span className="text-slate-600 font-medium">Risk Score:</span>
                <p className={cn("font-bold text-2xl mt-2", {
                  "text-red-600": riskScore > 100,
                  "text-yellow-600": riskScore > 90,
                  "text-green-600": riskScore <= 90,
                })}>
                  {riskScore.toFixed(0)}/100
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <span className="text-slate-600 font-medium">Status:</span>
                <p className={cn("font-bold text-2xl mt-2", {
                  "text-red-600": isBreached,
                  "text-yellow-600": isWarning,
                  "text-green-600": !isBreached && !isWarning,
                })}>
                  {isBreached ? 'BREACH' : isWarning ? 'WARNING' : 'COMPLIANT'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Information */}
      {loanData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-sm font-medium text-slate-600">Borrower:</span>
                <p className="text-lg font-semibold text-slate-900">{loanData.borrowerName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">Facility Amount:</span>
                <p className="text-lg font-semibold text-slate-900">
                  {loanData.currency} {loanData.facilityAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">Interest Rate Margin:</span>
                <p className="text-lg font-semibold text-slate-900">{loanData.interestRateMargin}%</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">ESG Features:</span>
                <p className="text-sm text-slate-700 line-clamp-2">{loanData.esgTarget}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk History */}
      {riskHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Recent Risk Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskHistory.slice(-5).reverse().map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {entry.status === 'breach' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {entry.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {entry.status === 'safe' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    <span className="text-sm text-slate-600">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      Leverage: {entry.leverage.toFixed(2)}x
                    </span>
                    <Badge 
                      variant={entry.status === 'breach' ? "destructive" : entry.status === 'warning' ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {entry.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}