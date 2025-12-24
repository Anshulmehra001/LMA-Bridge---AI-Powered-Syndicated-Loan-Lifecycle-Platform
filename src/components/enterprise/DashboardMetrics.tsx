'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApplication } from '@/contexts/ApplicationContext';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

export function DashboardMetrics() {
  const { state } = useApplication();

  // Calculate key metrics
  const totalExposure = state.currentLoan?.facilityAmount || 0;
  const currentRate = state.currentLoan?.interestRateMargin || 0;
  const esgDiscount = state.esgStatus.discountApplied ? 0.1 : 0;
  const effectiveRate = Math.max(0, currentRate - esgDiscount);
  const annualInterest = totalExposure * (effectiveRate / 100);
  const esgSavings = state.esgStatus.discountApplied ? totalExposure * 0.001 : 0;

  // Risk assessment
  const riskLevel = state.riskStatus.isInDefault ? 'HIGH' : 
                   state.riskStatus.warningLevel === 'warning' ? 'MEDIUM' : 'LOW';
  
  const riskColor = riskLevel === 'HIGH' ? 'text-red-600' : 
                   riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600';

  // Portfolio health score (0-100)
  const healthScore = state.currentLoan ? 
    Math.max(0, 100 - (state.riskStatus.currentLeverage / (state.currentLoan.leverageCovenant || 1)) * 50) : 0;

  const metrics = [
    {
      title: 'Total Exposure',
      value: `$${(totalExposure / 1000000).toFixed(0)}M`,
      subtitle: state.currentLoan?.currency || 'USD',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Effective Rate',
      value: `${effectiveRate.toFixed(2)}%`,
      subtitle: esgDiscount > 0 ? `${esgDiscount}% ESG discount` : 'Base rate',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Annual Interest',
      value: `$${(annualInterest / 1000000).toFixed(1)}M`,
      subtitle: esgSavings > 0 ? `$${(esgSavings / 1000).toFixed(0)}K saved` : 'Projected',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Risk Level',
      value: riskLevel,
      subtitle: `Leverage: ${state.riskStatus.currentLeverage.toFixed(2)}x`,
      icon: riskLevel === 'HIGH' ? AlertTriangle : riskLevel === 'MEDIUM' ? Clock : Shield,
      color: riskColor,
      bgColor: riskLevel === 'HIGH' ? 'bg-red-50' : riskLevel === 'MEDIUM' ? 'bg-yellow-50' : 'bg-green-50'
    },
    {
      title: 'Portfolio Health',
      value: `${healthScore.toFixed(0)}%`,
      subtitle: healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : 'Needs attention',
      icon: healthScore > 80 ? CheckCircle : healthScore > 60 ? Clock : AlertTriangle,
      color: healthScore > 80 ? 'text-green-600' : healthScore > 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: healthScore > 80 ? 'bg-green-50' : healthScore > 60 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Syndicate Size',
      value: state.tradingStatus.lenderAllocations.length.toString(),
      subtitle: 'Active participants',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  if (!state.currentLoan) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No loan data available. Complete loan origination to view metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {metric.title}
                </p>
                <p className={`text-3xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </p>
                <p className="text-xs text-slate-500">
                  {metric.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}