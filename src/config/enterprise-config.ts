/**
 * Enterprise Configuration for LMA Bridge
 * Centralized configuration for enterprise features and settings
 */

export interface EnterpriseConfig {
  // Application metadata
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    buildDate: string;
  };

  // Feature flags
  features: {
    aiDocumentProcessing: boolean;
    realTimeRiskMonitoring: boolean;
    esgTracking: boolean;
    secondaryTrading: boolean;
    auditLogging: boolean;
    enterpriseSecurity: boolean;
    multiCurrency: boolean;
    advancedReporting: boolean;
  };

  // Business rules
  business: {
    // Loan limits
    minFacilityAmount: number;
    maxFacilityAmount: number;
    
    // Interest rate constraints
    minInterestRateMargin: number;
    maxInterestRateMargin: number;
    
    // Leverage covenant limits
    minLeverageCovenant: number;
    maxLeverageCovenant: number;
    
    // ESG discount parameters
    esgDiscountRate: number;
    maxEsgDiscount: number;
    
    // Risk thresholds
    riskWarningThreshold: number; // Percentage of covenant
    riskBreachThreshold: number;  // Percentage of covenant
    
    // Trading limits
    minTradeAmount: number;
    maxTradeAmount: number;
  };

  // Supported currencies
  currencies: {
    primary: string;
    supported: string[];
    exchangeRates?: Record<string, number>;
  };

  // UI configuration
  ui: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showAdvancedFeatures: boolean;
    defaultTab: 'origination' | 'esg' | 'risk' | 'trading';
    refreshInterval: number; // milliseconds
  };

  // Security settings
  security: {
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    requireTwoFactor: boolean;
    auditRetentionDays: number;
    encryptSensitiveData: boolean;
  };

  // Integration settings
  integrations: {
    aiProvider: 'gemini' | 'openai' | 'azure' | 'local';
    documentStorage: 'local' | 's3' | 'azure' | 'gcp';
    database: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
    messageQueue: 'none' | 'redis' | 'rabbitmq' | 'kafka';
  };

  // Compliance settings
  compliance: {
    lmaStandards: boolean;
    gdprCompliant: boolean;
    soxCompliant: boolean;
    dataRetentionDays: number;
    requireDigitalSignatures: boolean;
  };

  // Performance settings
  performance: {
    cacheEnabled: boolean;
    cacheTtl: number; // seconds
    maxConcurrentUsers: number;
    rateLimitPerMinute: number;
    enableCompression: boolean;
  };
}

// Default enterprise configuration
export const defaultEnterpriseConfig: EnterpriseConfig = {
  app: {
    name: 'LMA Bridge Enterprise',
    version: '2.0.0',
    environment: 'production',
    buildDate: new Date().toISOString(),
  },

  features: {
    aiDocumentProcessing: true,
    realTimeRiskMonitoring: true,
    esgTracking: true,
    secondaryTrading: true,
    auditLogging: true,
    enterpriseSecurity: true,
    multiCurrency: true,
    advancedReporting: true,
  },

  business: {
    minFacilityAmount: 1_000_000,      // $1M
    maxFacilityAmount: 10_000_000_000, // $10B
    
    minInterestRateMargin: 0.01,       // 0.01%
    maxInterestRateMargin: 20.0,       // 20%
    
    minLeverageCovenant: 0.1,          // 0.1x
    maxLeverageCovenant: 50.0,         // 50x
    
    esgDiscountRate: 0.1,              // 0.1% discount
    maxEsgDiscount: 0.5,               // Maximum 0.5% total discount
    
    riskWarningThreshold: 0.9,         // 90% of covenant
    riskBreachThreshold: 1.0,          // 100% of covenant
    
    minTradeAmount: 1_000_000,         // $1M minimum trade
    maxTradeAmount: 1_000_000_000,     // $1B maximum trade
  },

  currencies: {
    primary: 'USD',
    supported: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK'],
  },

  ui: {
    theme: 'light',
    compactMode: false,
    showAdvancedFeatures: true,
    defaultTab: 'origination',
    refreshInterval: 30000, // 30 seconds
  },

  security: {
    sessionTimeout: 480,        // 8 hours
    maxLoginAttempts: 5,
    requireTwoFactor: false,    // Can be enabled for production
    auditRetentionDays: 2555,   // 7 years
    encryptSensitiveData: true,
  },

  integrations: {
    aiProvider: 'gemini',
    documentStorage: 'local',
    database: 'sqlite',
    messageQueue: 'none',
  },

  compliance: {
    lmaStandards: true,
    gdprCompliant: true,
    soxCompliant: false,        // Can be enabled for public companies
    dataRetentionDays: 2555,    // 7 years
    requireDigitalSignatures: false,
  },

  performance: {
    cacheEnabled: true,
    cacheTtl: 300,              // 5 minutes
    maxConcurrentUsers: 100,
    rateLimitPerMinute: 1000,
    enableCompression: true,
  },
};

// Environment-specific overrides
export const getEnterpriseConfig = (): EnterpriseConfig => {
  const config = { ...defaultEnterpriseConfig };
  
  // Override based on environment
  if (typeof window !== 'undefined') {
    const env = process.env.NODE_ENV;
    
    if (env === 'development') {
      config.app.environment = 'development';
      config.security.sessionTimeout = 60; // 1 hour for dev
      config.ui.refreshInterval = 10000;   // 10 seconds for dev
      config.performance.maxConcurrentUsers = 10;
    } else if (env === 'production') {
      config.app.environment = 'production';
      config.security.requireTwoFactor = true;
      config.compliance.soxCompliant = true;
      config.performance.maxConcurrentUsers = 1000;
    }
  }
  
  return config;
};

// Configuration validation
export const validateEnterpriseConfig = (config: EnterpriseConfig): string[] => {
  const errors: string[] = [];
  
  // Validate business rules
  if (config.business.minFacilityAmount >= config.business.maxFacilityAmount) {
    errors.push('Minimum facility amount must be less than maximum');
  }
  
  if (config.business.minInterestRateMargin >= config.business.maxInterestRateMargin) {
    errors.push('Minimum interest rate margin must be less than maximum');
  }
  
  if (config.business.esgDiscountRate > config.business.maxEsgDiscount) {
    errors.push('ESG discount rate cannot exceed maximum ESG discount');
  }
  
  // Validate currencies
  if (!config.currencies.supported.includes(config.currencies.primary)) {
    errors.push('Primary currency must be in supported currencies list');
  }
  
  // Validate security settings
  if (config.security.sessionTimeout <= 0) {
    errors.push('Session timeout must be positive');
  }
  
  if (config.security.maxLoginAttempts <= 0) {
    errors.push('Max login attempts must be positive');
  }
  
  return errors;
};

// Export singleton instance
export const enterpriseConfig = getEnterpriseConfig();