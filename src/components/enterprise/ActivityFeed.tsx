'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApplication } from '@/contexts/ApplicationContext';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText,
  DollarSign,
  Leaf
} from 'lucide-react';

interface ActivityItem {
  id: string;
  timestamp: Date;
  type: 'loan_created' | 'risk_alert' | 'esg_applied' | 'trade_executed' | 'verification' | 'system';
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

export function ActivityFeed() {
  const { state } = useApplication();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Generate activity feed based on application state
  useEffect(() => {
    const newActivities: ActivityItem[] = [];

    // Loan creation activity
    if (state.currentLoan) {
      newActivities.push({
        id: 'loan_created',
        timestamp: state.verificationStatus.verificationTimestamp || new Date(),
        type: 'loan_created',
        title: 'Loan Agreement Processed',
        description: `${state.currentLoan.borrowerName} - ${state.currentLoan.currency} ${state.currentLoan.facilityAmount.toLocaleString()}`,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    }

    // Risk alerts
    if (state.riskStatus.isInDefault) {
      newActivities.push({
        id: 'risk_breach',
        timestamp: new Date(),
        type: 'risk_alert',
        title: 'Covenant Breach Detected',
        description: `Leverage ratio ${state.riskStatus.currentLeverage.toFixed(2)}x exceeds covenant limit`,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      });
    } else if (state.riskStatus.warningLevel === 'warning') {
      newActivities.push({
        id: 'risk_warning',
        timestamp: new Date(),
        type: 'risk_alert',
        title: 'Risk Warning',
        description: 'Leverage approaching covenant limits - monitoring required',
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      });
    }

    // ESG discount application
    if (state.esgStatus.discountApplied) {
      newActivities.push({
        id: 'esg_discount',
        timestamp: new Date(),
        type: 'esg_applied',
        title: 'ESG Discount Applied',
        description: 'Interest rate reduced by 0.1% for sustainability performance',
        icon: Leaf,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    }

    // Trading activity
    if (state.tradingStatus.lastTradeTimestamp) {
      newActivities.push({
        id: 'trade_executed',
        timestamp: state.tradingStatus.lastTradeTimestamp,
        type: 'trade_executed',
        title: 'Secondary Market Trade',
        description: 'Syndicate allocation updated - settlement completed',
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    }

    // Verification status
    if (state.verificationStatus.isVerified) {
      newActivities.push({
        id: 'verification',
        timestamp: state.verificationStatus.verificationTimestamp || new Date(),
        type: 'verification',
        title: 'Data Verified & Locked',
        description: 'Loan data has been verified and locked for processing',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    }

    // System activity
    newActivities.push({
      id: 'system_status',
      timestamp: new Date(),
      type: 'system',
      title: 'System Status',
      description: 'All systems operational - real-time monitoring active',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    });

    // Sort by timestamp (newest first)
    newActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setActivities(newActivities.slice(0, 10)); // Keep last 10 activities
  }, [state]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'loan_created':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Loan</Badge>;
      case 'risk_alert':
        return <Badge variant="destructive">Risk</Badge>;
      case 'esg_applied':
        return <Badge variant="default" className="bg-green-100 text-green-800">ESG</Badge>;
      case 'trade_executed':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Trading</Badge>;
      case 'verification':
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'system':
        return <Badge variant="secondary">System</Badge>;
      default:
        return <Badge variant="secondary">Activity</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {getActivityBadge(activity.type)}
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}