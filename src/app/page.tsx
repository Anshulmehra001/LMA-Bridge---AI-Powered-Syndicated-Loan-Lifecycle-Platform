'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OriginationTab } from '@/components/tabs/OriginationTab';
import { ESGManagerTab } from '@/components/tabs/ESGManagerTab';
import { RiskDashboardTab } from '@/components/tabs/RiskDashboardTab';
import { TradingManagerTab } from '@/components/tabs/TradingManagerTab';
import { HeaderClock } from '@/components/ui/dynamic-clock';
import { useApplication } from '@/contexts/ApplicationContext';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';

type TabValue = 'origination' | 'esg' | 'risk' | 'trading';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabValue>('origination');
  const { state } = useApplication();

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  // Calculate system status
  const getSystemStatus = () => {
    if (state.currentLoan) {
      if (state.riskStatus.isInDefault) {
        return { status: 'warning', label: 'Risk Alert', icon: AlertCircle, color: 'bg-red-100 text-red-800' };
      }
      if (state.verificationStatus.isVerified) {
        return { status: 'active', label: 'Active', icon: CheckCircle, color: 'bg-green-100 text-green-800' };
      }
      return { status: 'processing', label: 'Processing', icon: Clock, color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'ready', label: 'Ready', icon: Users, color: 'bg-blue-100 text-blue-800' };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 font-inter flex flex-col">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl border-b border-slate-700">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    LMA Bridge
                  </h1>
                  <p className="text-slate-300 text-sm mt-0.5">
                    Enterprise Loan Management Platform
                  </p>
                </div>
              </div>
              <Badge className={`${systemStatus.color} border-0 shadow-sm`}>
                <systemStatus.icon className="w-3 h-3 mr-1" />
                {systemStatus.label}
              </Badge>
            </div>
            <div className="flex items-center space-x-6">
              {/* Current Loan Info */}
              {state.currentLoan && (
                <div className="text-right bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                  <p className="text-sm font-medium text-white">
                    {state.currentLoan.borrowerName}
                  </p>
                  <p className="text-xs text-slate-300">
                    {state.currentLoan.currency} {state.currentLoan.facilityAmount.toLocaleString()}
                  </p>
                </div>
              )}
              
              {/* System Time */}
              <HeaderClock />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
          {/* Enhanced Tab Navigation */}
          <div className="mb-8 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200/50">
              <TabsTrigger 
                value="origination"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700 font-medium rounded-lg transition-all hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <span>Origination</span>
                  {state.currentLoan && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="esg"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700 font-medium rounded-lg transition-all hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <span>ESG Manager</span>
                  {state.esgStatus.discountApplied && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="risk"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700 font-medium rounded-lg transition-all hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <span>Risk Dashboard</span>
                  {state.riskStatus.isInDefault && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="trading"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700 font-medium rounded-lg transition-all hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <span>Trading Manager</span>
                  {state.tradingStatus.lastTradeTimestamp && (
                    <Clock className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl transition-all duration-300 flex-1 min-h-0 flex flex-col">
            <TabsContent value="origination" className="p-8 m-0 animate-fade-in flex-1 min-h-0">
              <OriginationTab />
            </TabsContent>

            <TabsContent value="esg" className="p-8 m-0 animate-fade-in flex-1 min-h-0">
              <ESGManagerTab />
            </TabsContent>

            <TabsContent value="risk" className="p-8 m-0 animate-fade-in flex-1 min-h-0">
              <RiskDashboardTab />
            </TabsContent>

            <TabsContent value="trading" className="p-8 m-0 animate-fade-in flex-1 min-h-0">
              <TradingManagerTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700 flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <div className="flex items-center space-x-4">
              <p className="font-medium text-white">LMA Bridge Enterprise</p>
              <span className="text-slate-500">|</span>
              <p>Version 2.0.0</p>
              <span className="text-slate-500">|</span>
              <p>© 2025 LMA Community</p>
            </div>
            <div className="flex items-center space-x-4">
              {state.currentLoan && (
                <>
                  <p className="text-slate-200">Active Loan: {state.currentLoan.borrowerName}</p>
                  <span className="text-slate-500">|</span>
                </>
              )}
              <p className="text-slate-200">System Status: <span className="text-emerald-400">{systemStatus.label}</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
