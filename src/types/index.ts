// Core data models for LMA Bridge

export interface LoanData {
  borrowerName: string;
  facilityAmount: number;
  currency: string;
  interestRateMargin: number;
  leverageCovenant: number;
  esgTarget: string;
}

export interface VerificationState {
  isVerified: boolean;
  isLocked: boolean;
  verificationTimestamp: Date | null;
}

export interface ESGStatus {
  target: string;
  discountApplied: boolean;
  verificationUploaded: boolean;
}

export interface RiskStatus {
  currentLeverage: number;
  isInDefault: boolean;
  warningLevel: 'safe' | 'warning' | 'breach';
}

export interface LenderAllocation {
  lenderName: string;
  amount: number;
  percentage: number;
}

export interface TradingStatus {
  lenderAllocations: LenderAllocation[];
  totalFacilityAmount: number;
  lastTradeTimestamp: Date | null;
  settlementStatus: 'instant' | 'pending';
}

export interface ApplicationState {
  currentLoan: LoanData | null;
  verificationStatus: VerificationState;
  esgStatus: ESGStatus;
  riskStatus: RiskStatus;
  tradingStatus: TradingStatus;
}

export interface FormFieldState {
  value: string | number;
  isHighlighted: boolean;
  isLocked: boolean;
  hasError: boolean;
}

export interface TabState {
  activeTab: 'origination' | 'esg' | 'risk' | 'trading';
  tabsEnabled: boolean[];
}

// Validation schemas and types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface LoanDataValidationSchema {
  borrowerName: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  facilityAmount: {
    required: boolean;
    min: number;
    max: number;
    type: 'number';
  };
  currency: {
    required: boolean;
    validCurrencies: string[];
  };
  interestRateMargin: {
    required: boolean;
    min: number;
    max: number;
    type: 'number';
  };
  leverageCovenant: {
    required: boolean;
    min: number;
    max: number;
    type: 'number';
  };
  esgTarget: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
}

// Validation schema instance
export const loanDataValidationSchema: LoanDataValidationSchema = {
  borrowerName: {
    required: true,
    minLength: 1,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-&.,()'\u00C0-\u017F]+$/
  },
  facilityAmount: {
    required: true,
    min: 1000000, // $1M minimum
    max: 1000000000, // $1B maximum (more reasonable for 32-bit float)
    type: 'number'
  },
  currency: {
    required: true,
    validCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK']
  },
  interestRateMargin: {
    required: true,
    min: 0.01, // 0.01% minimum
    max: 20.0, // 20% maximum
    type: 'number'
  },
  leverageCovenant: {
    required: true,
    min: 0.1, // 0.1x minimum
    max: 50.0, // 50x maximum
    type: 'number'
  },
  esgTarget: {
    required: true,
    minLength: 5,
    maxLength: 500
  }
};

// Validation functions
export const validateLoanData = (data: Partial<LoanData>): ValidationResult => {
  const errors: string[] = [];
  const schema = loanDataValidationSchema;

  // Validate borrowerName
  if (!data.borrowerName || data.borrowerName.trim().length === 0) {
    if (schema.borrowerName.required) {
      errors.push('Borrower name is required');
    }
  } else {
    if (data.borrowerName.length < schema.borrowerName.minLength) {
      errors.push(`Borrower name must be at least ${schema.borrowerName.minLength} characters`);
    }
    if (data.borrowerName.length > schema.borrowerName.maxLength) {
      errors.push(`Borrower name must not exceed ${schema.borrowerName.maxLength} characters`);
    }
    if (schema.borrowerName.pattern && !schema.borrowerName.pattern.test(data.borrowerName)) {
      errors.push('Borrower name contains invalid characters');
    }
    if (data.borrowerName.trim().length === 0) {
      errors.push('Borrower name cannot be only whitespace');
    }
  }

  // Validate facilityAmount
  if (data.facilityAmount === undefined || data.facilityAmount === null) {
    if (schema.facilityAmount.required) {
      errors.push('Facility amount is required');
    }
  } else {
    if (typeof data.facilityAmount !== 'number' || isNaN(data.facilityAmount)) {
      errors.push('Facility amount must be a valid number');
    } else {
      if (data.facilityAmount < schema.facilityAmount.min) {
        errors.push(`Facility amount must be at least $${schema.facilityAmount.min.toLocaleString()}`);
      }
      if (data.facilityAmount > schema.facilityAmount.max) {
        errors.push(`Facility amount must not exceed $${schema.facilityAmount.max.toLocaleString()}`);
      }
    }
  }

  // Validate currency
  if (!data.currency) {
    if (schema.currency.required) {
      errors.push('Currency is required');
    }
  } else {
    if (!schema.currency.validCurrencies.includes(data.currency)) {
      errors.push(`Currency must be one of: ${schema.currency.validCurrencies.join(', ')}`);
    }
  }

  // Validate interestRateMargin
  if (data.interestRateMargin === undefined || data.interestRateMargin === null) {
    if (schema.interestRateMargin.required) {
      errors.push('Interest rate margin is required');
    }
  } else {
    if (typeof data.interestRateMargin !== 'number' || isNaN(data.interestRateMargin)) {
      errors.push('Interest rate margin must be a valid number');
    } else {
      if (data.interestRateMargin < schema.interestRateMargin.min) {
        errors.push(`Interest rate margin must be at least ${schema.interestRateMargin.min}%`);
      }
      if (data.interestRateMargin > schema.interestRateMargin.max) {
        errors.push(`Interest rate margin must not exceed ${schema.interestRateMargin.max}%`);
      }
    }
  }

  // Validate leverageCovenant
  if (data.leverageCovenant === undefined || data.leverageCovenant === null) {
    if (schema.leverageCovenant.required) {
      errors.push('Leverage covenant is required');
    }
  } else {
    if (typeof data.leverageCovenant !== 'number' || isNaN(data.leverageCovenant)) {
      errors.push('Leverage covenant must be a valid number');
    } else {
      if (data.leverageCovenant < schema.leverageCovenant.min) {
        errors.push(`Leverage covenant must be at least ${schema.leverageCovenant.min}x`);
      }
      if (data.leverageCovenant > schema.leverageCovenant.max) {
        errors.push(`Leverage covenant must not exceed ${schema.leverageCovenant.max}x`);
      }
    }
  }

  // Validate esgTarget
  if (!data.esgTarget || data.esgTarget.trim().length === 0) {
    if (schema.esgTarget.required) {
      errors.push('ESG target is required');
    }
  } else {
    if (data.esgTarget.length < schema.esgTarget.minLength) {
      errors.push(`ESG target must be at least ${schema.esgTarget.minLength} characters`);
    }
    if (data.esgTarget.length > schema.esgTarget.maxLength) {
      errors.push(`ESG target must not exceed ${schema.esgTarget.maxLength} characters`);
    }
    if (data.esgTarget.trim().length < schema.esgTarget.minLength) {
      errors.push('ESG target cannot be only whitespace');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate individual fields
export const validateField = (fieldName: keyof LoanData, value: unknown): ValidationResult => {
  const partialData: Partial<LoanData> = {};
  (partialData as any)[fieldName] = value;
  const result = validateLoanData(partialData);
  
  // Filter errors to only include those for the specific field
  const fieldErrors = result.errors.filter(error => 
    error.toLowerCase().includes(fieldName.toLowerCase()) ||
    (fieldName === 'borrowerName' && error.includes('Borrower name')) ||
    (fieldName === 'facilityAmount' && error.includes('Facility amount')) ||
    (fieldName === 'interestRateMargin' && error.includes('Interest rate margin')) ||
    (fieldName === 'leverageCovenant' && error.includes('Leverage covenant')) ||
    (fieldName === 'esgTarget' && error.includes('ESG target'))
  );
  
  return {
    isValid: fieldErrors.length === 0,
    errors: fieldErrors
  };
};

// Data sanitization functions
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and normalize whitespace
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

export const sanitizeNumber = (input: unknown): number | null => {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input)) {
    return input;
  }
  
  if (typeof input === 'string') {
    // Remove non-numeric characters except decimal point and minus sign
    const cleaned = input.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  
  return null;
};

export const sanitizeLoanData = (data: Partial<LoanData>): Partial<LoanData> => {
  const sanitized: Partial<LoanData> = {};
  
  if (data.borrowerName !== undefined) {
    sanitized.borrowerName = sanitizeString(data.borrowerName);
  }
  
  if (data.facilityAmount !== undefined) {
    const amount = sanitizeNumber(data.facilityAmount);
    if (amount !== null) sanitized.facilityAmount = amount;
  }
  
  if (data.currency !== undefined) {
    sanitized.currency = sanitizeString(data.currency).toUpperCase();
  }
  
  if (data.interestRateMargin !== undefined) {
    const margin = sanitizeNumber(data.interestRateMargin);
    if (margin !== null) sanitized.interestRateMargin = margin;
  }
  
  if (data.leverageCovenant !== undefined) {
    const covenant = sanitizeNumber(data.leverageCovenant);
    if (covenant !== null) sanitized.leverageCovenant = covenant;
  }
  
  if (data.esgTarget !== undefined) {
    sanitized.esgTarget = sanitizeString(data.esgTarget);
  }
  
  return sanitized;
};

// Error handling types and utilities
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
}

export const createAPIError = (code: string, message: string, details?: any): APIError => ({
  code,
  message,
  details,
  timestamp: new Date()
});

export const getUserFriendlyError = (error: APIError | Error | string): UserFriendlyError => {
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      action: 'Please try again'
    };
  }
  
  if (error instanceof Error) {
    return {
      title: 'Application Error',
      message: 'An unexpected error occurred while processing your request.',
      action: 'Please refresh the page and try again'
    };
  }
  
  // Handle APIError
  switch (error.code) {
    case 'API_KEY_MISSING':
      return {
        title: 'Configuration Error',
        message: 'AI service is not configured. Using demo data instead.',
        action: 'Contact your administrator to configure the AI service'
      };
    
    case 'API_TIMEOUT':
      return {
        title: 'Service Timeout',
        message: 'The AI service is taking too long to respond. Using fallback data.',
        action: 'Please try again in a few moments'
      };
    
    case 'INVALID_RESPONSE':
      return {
        title: 'Processing Error',
        message: 'Unable to process the document. Using fallback data.',
        action: 'Please check your document format and try again'
      };
    
    case 'VALIDATION_ERROR':
      return {
        title: 'Data Validation Error',
        message: 'The extracted data contains invalid values.',
        action: 'Please review and correct the highlighted fields'
      };
    
    case 'NETWORK_ERROR':
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the AI service. Using offline mode.',
        action: 'Please check your internet connection'
      };
    
    case 'INVALID_API_KEY':
      return {
        title: 'API Configuration Error',
        message: 'The AI service API key is invalid. Using demo data instead.',
        action: 'Please contact your administrator to update the API key'
      };
    
    case 'QUOTA_EXCEEDED':
      return {
        title: 'AI Service Daily Limit Reached',
        message: 'You\'ve reached the free tier daily quota (1,500 requests). The application is working perfectly with demo data.',
        action: 'Wait for daily reset, create a new API key, or use manual data entry (which works great!)'
      };
    
    case 'MODEL_NOT_FOUND':
      return {
        title: 'Service Configuration Error',
        message: 'AI model not available. Using demo data instead.',
        action: 'Please contact your administrator'
      };
    
    case 'PERMISSION_DENIED':
      return {
        title: 'Access Denied',
        message: 'Access to AI service denied. Using demo data instead.',
        action: 'Please contact your administrator to check permissions'
      };
    
    case 'NO_WORKING_MODEL':
      return {
        title: 'AI Service Unavailable',
        message: 'No AI models are currently available. Using demo data instead.',
        action: 'Please try again later or use manual data entry'
      };
    
    default:
      return {
        title: 'Unexpected Error',
        message: error.message || 'An unexpected error occurred.',
        action: 'Please try again or contact support'
      };
  }
};

// API Response types
export interface AnalyzeLoanRequest {
  documentText: string;
}

export interface AnalyzeLoanResponse {
  success: boolean;
  data?: LoanData;
  error?: string;
  isMockData: boolean;
  validationErrors?: string[];
  confidence?: number;
  suggestions?: string[];
  processingTime?: number;
  extractedFields?: string[];
}