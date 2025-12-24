/**
 * Enterprise Security System
 * Comprehensive security controls for loan market applications
 */

import { securityConfig } from '@/config/enterprise';
import { auditLogger, AuditAction } from '@/lib/audit';
import { enterpriseErrorHandler, ErrorCode } from '@/lib/enterprise-errors';

export interface SecurityContext {
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  permissions: string[];
  riskScore: number;
}

export interface DataClassification {
  level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  categories: string[];
  retentionPeriod: number;
  encryptionRequired: boolean;
  auditRequired: boolean;
}

class EnterpriseSecurity {
  private static instance: EnterpriseSecurity;
  private activeSessions: Map<string, SecurityContext> = new Map();
  private suspiciousActivities: Map<string, number> = new Map();
  
  private constructor() {}
  
  public static getInstance(): EnterpriseSecurity {
    if (!EnterpriseSecurity.instance) {
      EnterpriseSecurity.instance = new EnterpriseSecurity();
    }
    return EnterpriseSecurity.instance;
  }
  
  // Data Classification and Protection
  public classifyLoanData(data: any): DataClassification {
    const hasPersonalData = this.containsPersonalData(data);
    const hasFinancialData = this.containsFinancialData(data);
    const hasCommercialData = this.containsCommercialData(data);
    
    let level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' = 'INTERNAL';
    const categories: string[] = [];
    
    if (hasPersonalData) {
      level = 'CONFIDENTIAL';
      categories.push('PII');
    }
    
    if (hasFinancialData) {
      level = 'CONFIDENTIAL';
      categories.push('FINANCIAL');
    }
    
    if (hasCommercialData) {
      categories.push('COMMERCIAL');
    }
    
    // Syndicated loan data is typically confidential
    if (data.facilityAmount || data.borrowerName) {
      level = 'CONFIDENTIAL';
      categories.push('SYNDICATED_LOAN');
    }
    
    return {
      level,
      categories,
      retentionPeriod: this.getRetentionPeriod(categories),
      encryptionRequired: ['CONFIDENTIAL', 'RESTRICTED'].includes(level),
      auditRequired: true,
    };
  }
  
  // Input Sanitization and Validation
  public sanitizeInput(input: string, context: 'DOCUMENT' | 'FORM' | 'API'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    let sanitized = input;
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>\"'&]/g, '');
    
    // Remove SQL injection patterns
    sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi, '');
    
    // Remove script injection patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Context-specific sanitization
    switch (context) {
      case 'DOCUMENT':
        // Allow more characters for document content
        sanitized = sanitized.replace(/[^\w\s\-\.,;:()$%@#!?]/g, '');
        break;
      case 'FORM':
        // Stricter for form inputs
        sanitized = sanitized.replace(/[^\w\s\-\.,]/g, '');
        break;
      case 'API':
        // Most restrictive for API inputs
        sanitized = sanitized.replace(/[^\w\s\-\.]/g, '');
        break;
    }
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Length limits based on context
    const maxLength = context === 'DOCUMENT' ? 100000 : 
                     context === 'FORM' ? 1000 : 500;
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  // Session Management
  public createSecurityContext(
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): SecurityContext {
    const sessionId = this.generateSecureSessionId();
    const context: SecurityContext = {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      permissions: this.getDefaultPermissions(),
      riskScore: this.calculateInitialRiskScore(ipAddress, userAgent),
    };
    
    this.activeSessions.set(sessionId, context);
    
    // Auto-cleanup expired sessions
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
    }, securityConfig.sessionTimeout);
    
    return context;
  }
  
  public validateSession(sessionId: string): SecurityContext | null {
    const context = this.activeSessions.get(sessionId);
    
    if (!context) {
      return null;
    }
    
    // Check if session has expired
    const now = new Date();
    const sessionAge = now.getTime() - context.timestamp.getTime();
    
    if (sessionAge > securityConfig.sessionTimeout) {
      this.activeSessions.delete(sessionId);
      auditLogger.log({
        sessionId,
        action: AuditAction.SESSION_TIMEOUT,
        resource: 'session_management',
        details: { sessionAge, timeout: securityConfig.sessionTimeout },
        success: false,
        riskLevel: 'MEDIUM',
      });
      return null;
    }
    
    return context;
  }
  
  // Threat Detection
  public detectSuspiciousActivity(
    context: SecurityContext,
    activity: string,
    details: Record<string, any>
  ): boolean {
    const key = `${context.ipAddress || 'unknown'}_${activity}`;
    const count = this.suspiciousActivities.get(key) || 0;
    
    // Rate limiting
    if (count > this.getActivityThreshold(activity)) {
      this.handleSuspiciousActivity(context, activity, details);
      return true;
    }
    
    this.suspiciousActivities.set(key, count + 1);
    
    // Clean up old entries
    setTimeout(() => {
      this.suspiciousActivities.delete(key);
    }, 300000); // 5 minutes
    
    return false;
  }
  
  // Data Encryption (simplified for demo)
  public encryptSensitiveData(data: string): string {
    if (!securityConfig.enableEncryption) {
      return data;
    }
    
    // In production, use proper encryption libraries like crypto-js or node crypto
    // This is a simple obfuscation for demo purposes
    return Buffer.from(data).toString('base64');
  }
  
  public decryptSensitiveData(encryptedData: string): string {
    if (!securityConfig.enableEncryption) {
      return encryptedData;
    }
    
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf-8');
    } catch (error) {
      throw enterpriseErrorHandler.createError(
        ErrorCode.ENCRYPTION_ERROR,
        error as Error
      );
    }
  }
  
  // Access Control
  public checkPermission(
    context: SecurityContext,
    resource: string,
    action: string
  ): boolean {
    const requiredPermission = `${resource}:${action}`;
    
    // Check if user has specific permission
    if (context.permissions.includes(requiredPermission)) {
      return true;
    }
    
    // Check for wildcard permissions
    if (context.permissions.includes(`${resource}:*`) || 
        context.permissions.includes('*:*')) {
      return true;
    }
    
    // Log unauthorized access attempt
    auditLogger.log({
      userId: context.userId,
      sessionId: context.sessionId,
      action: AuditAction.UNAUTHORIZED_ACCESS,
      resource,
      details: {
        attemptedAction: action,
        userPermissions: context.permissions,
        requiredPermission,
      },
      success: false,
      riskLevel: 'HIGH',
    });
    
    return false;
  }
  
  // File Upload Security
  public validateFileUpload(
    file: File | { name: string; size: number; type: string },
    context: SecurityContext
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > securityConfig.maxFileSize) {
      errors.push(`File size exceeds maximum allowed (${securityConfig.maxFileSize} bytes)`);
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !securityConfig.allowedFileTypes.includes(fileExtension)) {
      errors.push(`File type not allowed. Allowed types: ${securityConfig.allowedFileTypes.join(', ')}`);
    }
    
    // Check for suspicious file names
    if (this.isSuspiciousFileName(file.name)) {
      errors.push('Suspicious file name detected');
      this.detectSuspiciousActivity(context, 'SUSPICIOUS_FILE_UPLOAD', {
        fileName: file.name,
        fileSize: file.size,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  // Security Metrics
  public getSecurityMetrics(): {
    activeSessions: number;
    suspiciousActivities: number;
    encryptionEnabled: boolean;
    auditingEnabled: boolean;
    averageRiskScore: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const averageRiskScore = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.riskScore, 0) / sessions.length 
      : 0;
    
    return {
      activeSessions: this.activeSessions.size,
      suspiciousActivities: this.suspiciousActivities.size,
      encryptionEnabled: securityConfig.enableEncryption,
      auditingEnabled: securityConfig.enableAuditLogging,
      averageRiskScore,
    };
  }
  
  private containsPersonalData(data: any): boolean {
    const personalDataPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    return personalDataPatterns.some(pattern => pattern.test(dataString));
  }
  
  private containsFinancialData(data: any): boolean {
    return !!(data.facilityAmount || data.interestRateMargin || data.leverageCovenant);
  }
  
  private containsCommercialData(data: any): boolean {
    return !!(data.borrowerName || data.esgTarget);
  }
  
  private getRetentionPeriod(categories: string[]): number {
    // Return retention period in days
    if (categories.includes('PII')) return 2555; // 7 years
    if (categories.includes('FINANCIAL')) return 2555; // 7 years
    if (categories.includes('SYNDICATED_LOAN')) return 3650; // 10 years
    return 1825; // 5 years default
  }
  
  private generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 15);
    return `sess_${timestamp}_${random}`;
  }
  
  private getDefaultPermissions(): string[] {
    return [
      'document:read',
      'document:analyze',
      'loan:read',
      'risk:read',
      'esg:read',
    ];
  }
  
  private calculateInitialRiskScore(ipAddress?: string, userAgent?: string): number {
    let score = 0;
    
    // IP-based risk (simplified)
    if (!ipAddress) score += 20;
    
    // User agent risk (simplified)
    if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
      score += 30;
    }
    
    return Math.min(100, score);
  }
  
  private getActivityThreshold(activity: string): number {
    const thresholds: Record<string, number> = {
      'document_upload': 10,
      'api_request': 100,
      'login_attempt': 5,
      'data_export': 3,
    };
    
    return thresholds[activity] || 20;
  }
  
  private handleSuspiciousActivity(
    context: SecurityContext,
    activity: string,
    details: Record<string, any>
  ): void {
    auditLogger.log({
      userId: context.userId,
      sessionId: context.sessionId,
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      resource: 'security_system',
      details: {
        activity,
        ...details,
        riskScore: context.riskScore,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success: false,
      riskLevel: 'CRITICAL',
    });
    
    // In production, trigger immediate security response
    console.warn('🚨 SUSPICIOUS ACTIVITY DETECTED:', {
      activity,
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
      },
      details,
    });
  }
  
  private isSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|vbs|js|jar)$/i,
      /[<>:"|?*]/,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }
}

export const enterpriseSecurity = EnterpriseSecurity.getInstance();