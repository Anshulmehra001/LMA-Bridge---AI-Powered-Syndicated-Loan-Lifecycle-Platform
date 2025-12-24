/**
 * Enterprise Configuration System
 * Centralized configuration for production deployment
 */

export interface EnterpriseConfig {
  // API Configuration
  api: {
    geminiApiKey: string;
    timeout: number;
    retryAttempts: number;
    rateLimitPerMinute: number;
  };
  
  // Security Configuration
  security: {
    enableAuditLogging: boolean;
    enableEncryption: boolean;
    sessionTimeout: number;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  
  // Performance Configuration
  performance: {
    cacheTimeout: number;
    maxConcurrentRequests: number;
    enableCompression: boolean;
    enableCDN: boolean;
  };
  
  // Compliance Configuration
  compliance: {
    enableGDPR: boolean;
    enableSOX: boolean;
    dataRetentionDays: number;
    auditLogRetentionDays: number;
  };
  
  // Feature Flags
  features: {
    enableAIAnalysis: boolean;
    enableRealTimeUpdates: boolean;
    enableAdvancedReporting: boolean;
    enableMultiTenant: boolean;
  };
}

const getEnterpriseConfig = (): EnterpriseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    api: {
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      timeout: parseInt(process.env.API_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3'),
      rateLimitPerMinute: parseInt(process.env.API_RATE_LIMIT || '60'),
    },
    
    security: {
      enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true' || isProduction,
      enableEncryption: process.env.ENABLE_ENCRYPTION === 'true' || isProduction,
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(','),
    },
    
    performance: {
      cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300000'), // 5 minutes
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
      enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      enableCDN: process.env.ENABLE_CDN === 'true' || isProduction,
    },
    
    compliance: {
      enableGDPR: process.env.ENABLE_GDPR === 'true' || isProduction,
      enableSOX: process.env.ENABLE_SOX === 'true' || isProduction,
      dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '2555'), // 7 years
      auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555'),
    },
    
    features: {
      enableAIAnalysis: process.env.ENABLE_AI_ANALYSIS !== 'false',
      enableRealTimeUpdates: process.env.ENABLE_REALTIME_UPDATES === 'true',
      enableAdvancedReporting: process.env.ENABLE_ADVANCED_REPORTING === 'true' || isProduction,
      enableMultiTenant: process.env.ENABLE_MULTI_TENANT === 'true',
    },
  };
};

export const enterpriseConfig = getEnterpriseConfig();

// Configuration validation
export const validateEnterpriseConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = enterpriseConfig;
  
  // Validate API configuration
  if (!config.api.geminiApiKey && config.features.enableAIAnalysis) {
    errors.push('GEMINI_API_KEY is required when AI analysis is enabled');
  }
  
  if (config.api.timeout < 5000) {
    errors.push('API timeout must be at least 5 seconds');
  }
  
  // Validate security configuration
  if (config.security.sessionTimeout < 300000) { // 5 minutes minimum
    errors.push('Session timeout must be at least 5 minutes');
  }
  
  if (config.security.maxFileSize > 104857600) { // 100MB maximum
    errors.push('Maximum file size cannot exceed 100MB');
  }
  
  // Validate compliance configuration
  if (config.compliance.dataRetentionDays < 1) {
    errors.push('Data retention period must be at least 1 day');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export individual config sections for easier access
export const apiConfig = enterpriseConfig.api;
export const securityConfig = enterpriseConfig.security;
export const performanceConfig = enterpriseConfig.performance;
export const complianceConfig = enterpriseConfig.compliance;
export const featureFlags = enterpriseConfig.features;