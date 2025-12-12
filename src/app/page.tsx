'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OriginationTab } from '@/components/tabs/OriginationTab';
import { ESGManagerTab } from '@/components/tabs/ESGManagerTab';
import { RiskDashboardTab } from '@/components/tabs/RiskDashboardTab';
import { TradingManagerTab } from '@/components/tabs/TradingManagerTab';
import { useApplication } from '@/contexts/ApplicationContext';

type TabValue = 'origination' | 'esg' | 'risk' | 'trading';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabValue>('origination');
  const { state, toggleDemoMode } = useApplication();

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                LMA Bridge
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Syndicated Loan Lifecycle Platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Header content can be added here if needed */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation */}
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger 
                value="origination"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-md transition-all"
              >
                Origination
              </TabsTrigger>
              <TabsTrigger 
                value="esg"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-md transition-all"
              >
                ESG Manager
              </TabsTrigger>
              <TabsTrigger 
                value="risk"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-md transition-all"
              >
                Risk Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="trading"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-md transition-all"
              >
                Trading Manager
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm transition-all duration-300">
            <TabsContent value="origination" className="p-0 m-0 animate-fade-in">
              <OriginationTab />
            </TabsContent>

            <TabsContent value="esg" className="p-6 m-0 animate-fade-in">
              <ESGManagerTab />
            </TabsContent>

            <TabsContent value="risk" className="p-6 m-0 animate-fade-in">
              <RiskDashboardTab />
            </TabsContent>

            <TabsContent value="trading" className="p-6 m-0 animate-fade-in">
              <TradingManagerTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>© 2024 LMA Bridge - Syndicated Loan Lifecycle Platform</p>
            <div className="flex items-center space-x-4">
              <p>Built for LMA Community</p>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  state.demoMode 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {state.demoMode ? 'Demo Mode' : 'Live Mode'}
                </span>
                <button
                  onClick={toggleDemoMode}
                  className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
                >
                  Toggle Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
