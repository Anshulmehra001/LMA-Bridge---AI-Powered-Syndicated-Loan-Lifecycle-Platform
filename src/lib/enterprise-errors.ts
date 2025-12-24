/**
 * Enterprise Error Handling System
 * Comprehensive error management for production environments
 */

import { auditLogger, AuditAction } from '@/lib/audit';

export enum ErrorCode {
  // Input Validation Errors
  INVALID_INPUT = 'E001',
  EMPTY_INPUT = 'E002',
  INPUT_TOO_LARGE = 'E003',
  INVALID_FILE_TYPE = 'E004',
  
  // API Errors
  API_KEY_MISSING = 'E101',
  API_TIMEOUT = 'E102',
  API_RATE_LIMIT = 'E103',
  API_QUOTA_EXCEEDED = 'E104',
  API_INVALID_RESPONSE = 'E105',
  
  // Processing Errors
  PARSING_ERROR = 'E201',
  VALIDATION_ERROR = 'E202',
  SANITIZATION_ERROR = 'E203',
  
  // Business Logic Errors
  INSUFFICIENT_DATA = 'E301',
  INVALID_LOAN_TERMS = 'E302',
  COVENANT_BREACH = 'E303',
  RISK_THRESHOLD_EXCEEDED = 'E304',
  
  // System Errors
  DATABASE_ERROR = 'E401',
  NETWORK_ERROR = 'E402',
  STORAGE_ERROR = 'E403',
  CONFIGURATION_ERROR = 'E404',
  
  // Security Errors
  UNAUTHORIZED_ACCESS = 'E501',
  SUSPICIOUS_ACTIVITY = 'E502',
  DATA_BREACH_ATTEMPT = 'E503',
  ENCRYPTION_ERROR = 'E504',
}

export interface EnterpriseError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  timestamp: Date;
  correlationId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'VALIDATION' | 'API' | 'PROCESSING' | 'BUSINESS' | 'SYSTEM' | 'SECURITY';
  retryable: boolean;
  suggestedAction?: string;
}

class EnterpriseErrorHandler {
  private static instance: EnterpriseErrorHandler;
  private errorLog: EnterpriseError[] = [];
  
  private constructor() {}
  
  public static getInstance(): EnterpriseErrorHandler {
    if (!EnterpriseErrorHandler.instance) {
      EnterpriseErrorHandler.instance = new EnterpriseErrorHandler();
    }
    return EnterpriseErrorHandler.instance;
  }
  
  public createError(
    code: ErrorCode,
    originalError?: Error,
    details?: Record<string, any>,
    userId?: string
  ): EnterpriseError {
    const errorInfo = this.getErrorInfo(code);
    const correlationId = this.generateCorrelationId();
    
    const enterpriseError: EnterpriseError = {
      code,
      message: originalError?.message || errorInfo.message,
      userMessage: errorInfo.userMessage,
      details: {
        ...details,
        originalStack: originalError?.stack,
        userId,
      },
      timestamp: new Date(),
      correlationId,
      severity: errorInfo.severity,
      category: errorInfo.category,
      retryable: errorInfo.retryable,
      suggestedAction: errorInfo.suggestedAction,
    };
    
    // Log the error
    this.logError(enterpriseError);
    
    // Audit the error
    this.auditError(enterpriseError, userId);
    
    return enterpriseError;
  }
  
  public handleApiError(error: Error, context?: Record<string, any>): EnterpriseError {
    let errorCode = ErrorCode.API_INVALID_RESPONSE;
    
    if (error.message.includes('timeout')) {
      errorCode = ErrorCode.API_TIMEOUT;
    } else if (error.message.includes('rate limit')) {
      errorCode = ErrorCode.API_RATE_LIMIT;
    } else if (error.message.includes('quota')) {
      errorCode = ErrorCode.API_QUOTA_EXCEEDED;
    }
    
    return this.createError(errorCode, error, context);
  }
  
  public handleValidationError(
    validationErrors: string[],
    context?: Record<string, any>
  ): EnterpriseError {
    return this.createError(
      ErrorCode.VALIDATION_ERROR,
      new Error(`Validation failed: ${validationErrors.join(', ')}`),
      { validationErrors, ...context }
    );
  }
  
  public handleSecurityError(
    code: ErrorCode,
    details: Record<string, any>,
    userId?: string
  ): EnterpriseError {
    const error = this.createError(code, undefined, details, userId);
    
    // Immediate security alert
    this.triggerSecurityAlert(error);
    
    return error;
  }
  
  public getErrorMetrics(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorsByCategory: Record<string, number>;
    recentErrors: EnterpriseError[];
  } {
    const errors = this.errorLog;
    
    const errorsByCode = errors.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recentErrors = errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    return {
      totalErrors: errors.length,
      errorsByCode,
      errorsBySeverity,
      errorsByCategory,
      recentErrors,
    };
  }
  
  private getErrorInfo(code: ErrorCode): {
    message: string;
    userMessage: string;
    severity: EnterpriseError['severity'];
    category: EnterpriseError['category'];
    retryable: boolean;
    suggestedAction?: string;
  } {
    const errorMap: Partial<Record<ErrorCode, any>> = {
      [ErrorCode.INVALID_INPUT]: {
        message: 'Invalid input provided',
        userMessage: 'Please check your input and try again.',
        severity: 'MEDIUM',
        category: 'VALIDATION',
        retryable: false,
        suggestedAction: 'Verify input format and content',
      },
      [ErrorCode.EMPTY_INPUT]: {
        message: 'Empty input provided',
        userMessage: 'Please provide document text to analyze.',
        severity: 'LOW',
        category: 'VALIDATION',
        retryable: false,
        suggestedAction: 'Add document content',
      },
      [ErrorCode.API_TIMEOUT]: {
        message: 'API request timed out',
        userMessage: 'The service is taking longer than expected. Please try again.',
        severity: 'MEDIUM',
        category: 'API',
        retryable: true,
        suggestedAction: 'Retry the operation',
      },
      [ErrorCode.API_KEY_MISSING]: {
        message: 'API key not configured',
        userMessage: 'AI analysis is temporarily unavailable. Using sample data.',
        severity: 'LOW',
        category: 'API',
        retryable: false,
        suggestedAction: 'Configure API key in environment variables',
      },
      [ErrorCode.VALIDATION_ERROR]: {
        message: 'Data validation failed',
        userMessage: 'Some data fields need correction. Please review and update.',
        severity: 'MEDIUM',
        category: 'BUSINESS',
        retryable: false,
        suggestedAction: 'Review and correct highlighted fields',
      },
      [ErrorCode.COVENANT_BREACH]: {
        message: 'Loan covenant breach detected',
        userMessage: 'Warning: Current leverage exceeds covenant limits.',
        severity: 'CRITICAL',
        category: 'BUSINESS',
        retryable: false,
        suggestedAction: 'Review risk parameters and take corrective action',
      },
      [ErrorCode.UNAUTHORIZED_ACCESS]: {
        message: 'Unauthorized access attempt',
        userMessage: 'Access denied. Please contact your administrator.',
        severity: 'CRITICAL',
        category: 'SECURITY',
        retryable: false,
        suggestedAction: 'Contact system administrator',
      },
    };
    
    return errorMap[code] || {
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'MEDIUM' as const,
      category: 'SYSTEM' as const,
      retryable: true,
      suggestedAction: 'Retry the operation or contact support',
    };
  }
  
  private logError(error: EnterpriseError): void {
    this.errorLog.push(error);
    
    // Console logging with appropriate level
    const logLevel = error.severity === 'CRITICAL' ? 'error' : 
                    error.severity === 'HIGH' ? 'error' :
                    error.severity === 'MEDIUM' ? 'warn' : 'info';
    
    console[logLevel](`🚨 [${error.code}] ${error.message}`, {
      correlationId: error.correlationId,
      severity: error.severity,
      category: error.category,
      details: error.details,
    });
    
    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(error);
    }
  }
  
  private async auditError(error: EnterpriseError, userId?: string): Promise<void> {
    let auditAction = AuditAction.API_ACCESS;
    
    if (error.category === 'SECURITY') {
      auditAction = AuditAction.UNAUTHORIZED_ACCESS;
    } else if (error.category === 'BUSINESS') {
      auditAction = AuditAction.RISK_ASSESSMENT;
    }
    
    await auditLogger.log({
      userId,
      action: auditAction,
      resource: 'error_handling',
      details: {
        errorCode: error.code,
        errorMessage: error.message,
        correlationId: error.correlationId,
        category: error.category,
      },
      success: false,
      errorMessage: error.message,
      riskLevel: error.severity === 'CRITICAL' ? 'CRITICAL' : 
                 error.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
    });
  }
  
  private triggerSecurityAlert(error: EnterpriseError): void {
    // In production, this would trigger immediate alerts
    console.error('🚨 SECURITY ALERT:', {
      code: error.code,
      message: error.message,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      details: error.details,
    });
    
    // Send to security monitoring system
    if (process.env.NODE_ENV === 'production') {
      this.sendSecurityAlert(error);
    }
  }
  
  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private sendToMonitoringService(error: EnterpriseError): void {
    // Integration with monitoring services like DataDog, New Relic, etc.
    // For now, just log
    console.log('📊 MONITORING:', JSON.stringify(error, null, 2));
  }
  
  private sendSecurityAlert(error: EnterpriseError): void {
    // Integration with security services like Splunk, SIEM, etc.
    // For now, just log
    console.log('🔒 SECURITY MONITORING:', JSON.stringify(error, null, 2));
  }
}

export const enterpriseErrorHandler = EnterpriseErrorHandler.getInstance();

// Utility functions for common error scenarios
export const createValidationError = (errors: string[], context?: Record<string, any>) =>
  enterpriseErrorHandler.handleValidationError(errors, context);

export const createApiError = (error: Error, context?: Record<string, any>) =>
  enterpriseErrorHandler.handleApiError(error, context);

export const createSecurityError = (code: ErrorCode, details: Record<string, any>, userId?: string) =>
  enterpriseErrorHandler.handleSecurityError(code, details, userId);