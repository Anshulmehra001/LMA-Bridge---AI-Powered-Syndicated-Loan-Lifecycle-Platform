/**
 * Enterprise Audit Logging System
 * Comprehensive audit trail for compliance and security
 */

import { securityConfig, complianceConfig } from '@/config/enterprise';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: AuditAction;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export enum AuditAction {
  // Document Actions
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_ANALYZE = 'DOCUMENT_ANALYZE',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  
  // Data Actions
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  
  // Trading Actions
  TRADE_EXECUTE = 'TRADE_EXECUTE',
  TRADE_CANCEL = 'TRADE_CANCEL',
  ALLOCATION_UPDATE = 'ALLOCATION_UPDATE',
  
  // Risk Actions
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  COVENANT_BREACH = 'COVENANT_BREACH',
  LEVERAGE_UPDATE = 'LEVERAGE_UPDATE',
  
  // ESG Actions
  ESG_TARGET_SET = 'ESG_TARGET_SET',
  ESG_MILESTONE_UPDATE = 'ESG_MILESTONE_UPDATE',
  
  // System Actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  API_ACCESS = 'API_ACCESS',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  
  // Security Actions
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
}

class AuditLogger {
  private static instance: AuditLogger;
  private auditLog: AuditEvent[] = [];
  
  private constructor() {}
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  public async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!securityConfig.enableAuditLogging) {
      return;
    }
    
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
    };
    
    // Store in memory (in production, this would go to a database)
    this.auditLog.push(auditEvent);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AUDIT:', {
        action: auditEvent.action,
        resource: auditEvent.resource,
        success: auditEvent.success,
        riskLevel: auditEvent.riskLevel,
        timestamp: auditEvent.timestamp.toISOString(),
      });
    }
    
    // In production, send to external audit service
    if (process.env.NODE_ENV === 'production') {
      await this.sendToAuditService(auditEvent);
    }
    
    // Clean up old logs based on retention policy
    this.cleanupOldLogs();
  }
  
  public async logDocumentAnalysis(
    documentText: string,
    success: boolean,
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DOCUMENT_ANALYZE,
      resource: 'loan_document',
      details: {
        documentLength: documentText.length,
        documentHash: this.hashDocument(documentText),
        aiEnabled: true,
      },
      success,
      errorMessage,
      riskLevel: success ? 'LOW' : 'MEDIUM',
    });
  }
  
  public async logTradeExecution(
    tradeDetails: any,
    success: boolean,
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.TRADE_EXECUTE,
      resource: 'trading_system',
      details: {
        tradeAmount: tradeDetails.amount,
        lenderCount: tradeDetails.lenders?.length || 0,
        facilityId: tradeDetails.facilityId,
      },
      success,
      errorMessage,
      riskLevel: success ? 'MEDIUM' : 'HIGH',
    });
  }
  
  public async logRiskAssessment(
    riskData: any,
    success: boolean,
    userId?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.RISK_ASSESSMENT,
      resource: 'risk_management',
      details: {
        currentLeverage: riskData.currentLeverage,
        leverageCovenant: riskData.leverageCovenant,
        riskStatus: riskData.riskStatus,
        breachDetected: riskData.currentLeverage > riskData.leverageCovenant,
      },
      success,
      riskLevel: riskData.currentLeverage > riskData.leverageCovenant ? 'CRITICAL' : 'LOW',
    });
  }
  
  public async logSecurityEvent(
    action: AuditAction,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'security_system',
      details,
      ipAddress,
      userAgent,
      success: false,
      riskLevel: 'CRITICAL',
    });
  }
  
  public getAuditTrail(
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    action?: AuditAction
  ): AuditEvent[] {
    let filteredLogs = [...this.auditLog];
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  public generateComplianceReport(): {
    totalEvents: number;
    criticalEvents: number;
    failedOperations: number;
    topActions: Array<{ action: string; count: number }>;
    riskDistribution: Record<string, number>;
  } {
    const logs = this.auditLog;
    
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const riskDistribution = logs.reduce((acc, log) => {
      acc[log.riskLevel] = (acc[log.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
    
    return {
      totalEvents: logs.length,
      criticalEvents: logs.filter(log => log.riskLevel === 'CRITICAL').length,
      failedOperations: logs.filter(log => !log.success).length,
      topActions,
      riskDistribution,
    };
  }
  
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private hashDocument(document: string): string {
    // Simple hash for audit purposes (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < document.length; i++) {
      const char = document.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  private async sendToAuditService(event: AuditEvent): Promise<void> {
    // In production, send to external audit service like Splunk, ELK, etc.
    // For now, we'll just log to console
    console.log('📊 AUDIT SERVICE:', JSON.stringify(event, null, 2));
  }
  
  private cleanupOldLogs(): void {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - complianceConfig.auditLogRetentionDays);
    
    this.auditLog = this.auditLog.filter(log => log.timestamp >= retentionDate);
  }
}

export const auditLogger = AuditLogger.getInstance();