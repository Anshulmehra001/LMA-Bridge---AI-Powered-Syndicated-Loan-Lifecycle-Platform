/**
 * Enterprise Data Validation System
 * Comprehensive validation for loan market data with regulatory compliance
 */

import { LoanData } from '@/types';
import { enterpriseErrorHandler, ErrorCode } from '@/lib/enterprise-errors';

export interface ValidationRule {
  field: keyof LoanData;
  required: boolean;
  type: 'string' | 'number' | 'email' | 'currency' | 'percentage' | 'date';
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
  complianceLevel: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  regulatoryFramework?: string[];
}

export interface EnterpriseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  complianceIssues: string[];
  fieldValidation: Record<string, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    complianceLevel: string;
  }>;
  overallScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Enhanced validation rules for enterprise loan market
const ENTERPRISE_VALIDATION_RULES: ValidationRule[] = [
  // Borrower Information
  {
    field: 'borrowerName',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-\.,&()]+$/,
    errorMessage: 'Borrower name must contain only valid business name characters',
    complianceLevel: 'REQUIRED',
    regulatoryFramework: ['Basel III', 'GDPR', 'KYC'],
  },
  
  // Financial Terms
  {
    field: 'facilityAmount',
    required: true,
    type: 'number',
    minValue: 1000000, // $1M minimum for syndicated loans
    maxValue: 50000000000, // $50B maximum
    errorMessage: 'Facility amount must be between $1M and $50B for syndicated loans',
    complianceLevel: 'REQUIRED',
    regulatoryFramework: ['Basel III', 'CCAR'],
  },
  
  {
    field: 'currency',
    required: true,
    type: 'string',
    pattern: /^(USD|EUR|GBP|JPY|CHF|CAD|AUD|SEK|NOK|DKK|HKD|SGD)$/,
    errorMessage: 'Currency must be a valid ISO 4217 code for major markets',
    complianceLevel: 'REQUIRED',
    regulatoryFramework: ['ISO 4217', 'SWIFT'],
  },
  
  {
    field: 'interestRateMargin',
    required: true,
    type: 'percentage',
    minValue: 0.01, // 1 basis point minimum
    maxValue: 20.0, // 20% maximum (distressed lending)
    errorMessage: 'Interest rate margin must be between 0.01% and 20%',
    complianceLevel: 'REQUIRED',
    regulatoryFramework: ['Basel III', 'LIBOR Transition'],
  },
  
  // Risk Management
  {
    field: 'leverageCovenant',
    required: true,
    type: 'number',
    minValue: 0.1,
    maxValue: 10.0,
    errorMessage: 'Leverage covenant must be between 0.1x and 10.0x',
    complianceLevel: 'REQUIRED',
    regulatoryFramework: ['Basel III', 'CCAR', 'CECL'],
  },
  
  // ESG Compliance
  {
    field: 'esgTarget',
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 1000,
    errorMessage: 'ESG target must be detailed and between 10-1000 characters',
    complianceLevel: 'REQUIRED',
    regulatoryFramework: ['EU Taxonomy', 'TCFD', 'SASB'],
  },
];

// Industry-specific validation rules
const INDUSTRY_VALIDATION_RULES: Record<string, Partial<ValidationRule>[]> = {
  'REAL_ESTATE': [
    {
      field: 'leverageCovenant',
      maxValue: 7.0,
      errorMessage: 'Real estate leverage should not exceed 7.0x',
    },
  ],
  'TECHNOLOGY': [
    {
      field: 'leverageCovenant',
      maxValue: 5.0,
      errorMessage: 'Technology sector leverage should not exceed 5.0x',
    },
  ],
  'ENERGY': [
    {
      field: 'esgTarget',
      minLength: 50,
      errorMessage: 'Energy sector requires detailed ESG commitments (min 50 chars)',
    },
  ],
};

class EnterpriseValidator {
  private static instance: EnterpriseValidator;
  
  private constructor() {}
  
  public static getInstance(): EnterpriseValidator {
    if (!EnterpriseValidator.instance) {
      EnterpriseValidator.instance = new EnterpriseValidator();
    }
    return EnterpriseValidator.instance;
  }
  
  public validateLoanData(
    data: Partial<LoanData>,
    industry?: string,
    regulatoryJurisdiction?: string
  ): EnterpriseValidationResult {
    const result: EnterpriseValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      complianceIssues: [],
      fieldValidation: {},
      overallScore: 100,
      riskLevel: 'LOW',
    };
    
    // Get applicable rules
    const rules = this.getApplicableRules(industry, regulatoryJurisdiction);
    
    // Validate each field
    for (const rule of rules) {
      const fieldResult = this.validateField(data[rule.field], rule);
      result.fieldValidation[rule.field] = fieldResult;
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
      
      result.warnings.push(...fieldResult.warnings);
      
      // Check compliance issues
      if (rule.complianceLevel === 'REQUIRED' && !fieldResult.isValid) {
        result.complianceIssues.push(
          `${rule.field} fails ${rule.regulatoryFramework?.join(', ')} compliance`
        );
      }
    }
    
    // Calculate overall score and risk level
    result.overallScore = this.calculateOverallScore(result);
    result.riskLevel = this.determineRiskLevel(result);
    
    // Additional business logic validations
    this.performBusinessLogicValidation(data, result);
    
    return result;
  }
  
  public validateField(value: any, rule: ValidationRule): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    complianceLevel: string;
  } {
    const fieldResult = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      complianceLevel: rule.complianceLevel,
    };
    
    // Required field validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldResult.isValid = false;
      fieldResult.errors.push(`${rule.field} is required`);
      return fieldResult;
    }
    
    // Skip further validation if field is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return fieldResult;
    }
    
    // Type validation
    if (!this.validateType(value, rule.type)) {
      fieldResult.isValid = false;
      fieldResult.errors.push(`${rule.field} must be of type ${rule.type}`);
      return fieldResult;
    }
    
    // Range validation for numbers
    if (rule.type === 'number' || rule.type === 'percentage') {
      const numValue = Number(value);
      
      if (rule.minValue !== undefined && numValue < rule.minValue) {
        fieldResult.isValid = false;
        fieldResult.errors.push(
          rule.errorMessage || `${rule.field} must be at least ${rule.minValue}`
        );
      }
      
      if (rule.maxValue !== undefined && numValue > rule.maxValue) {
        fieldResult.isValid = false;
        fieldResult.errors.push(
          rule.errorMessage || `${rule.field} must not exceed ${rule.maxValue}`
        );
      }
    }
    
    // Length validation for strings
    if (rule.type === 'string') {
      const strValue = String(value);
      
      if (rule.minLength !== undefined && strValue.length < rule.minLength) {
        fieldResult.isValid = false;
        fieldResult.errors.push(
          rule.errorMessage || `${rule.field} must be at least ${rule.minLength} characters`
        );
      }
      
      if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
        fieldResult.isValid = false;
        fieldResult.errors.push(
          rule.errorMessage || `${rule.field} must not exceed ${rule.maxLength} characters`
        );
      }
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(String(value))) {
      fieldResult.isValid = false;
      fieldResult.errors.push(
        rule.errorMessage || `${rule.field} format is invalid`
      );
    }
    
    // Custom validation
    if (rule.customValidator && !rule.customValidator(value)) {
      fieldResult.isValid = false;
      fieldResult.errors.push(
        rule.errorMessage || `${rule.field} fails custom validation`
      );
    }
    
    return fieldResult;
  }
  
  public validateRegulatoryCompliance(
    data: Partial<LoanData>,
    framework: string
  ): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const result = {
      isCompliant: true,
      violations: [] as string[],
      recommendations: [] as string[],
    };
    
    switch (framework) {
      case 'Basel III':
        this.validateBaselIII(data, result);
        break;
      case 'GDPR':
        this.validateGDPR(data, result);
        break;
      case 'CECL':
        this.validateCECL(data, result);
        break;
      case 'EU Taxonomy':
        this.validateEUTaxonomy(data, result);
        break;
    }
    
    return result;
  }
  
  private getApplicableRules(
    industry?: string,
    jurisdiction?: string
  ): ValidationRule[] {
    let rules = [...ENTERPRISE_VALIDATION_RULES];
    
    // Add industry-specific rules
    if (industry && INDUSTRY_VALIDATION_RULES[industry]) {
      const industryRules = INDUSTRY_VALIDATION_RULES[industry];
      rules = rules.map(rule => {
        const industryOverride = industryRules.find(ir => ir.field === rule.field);
        return industryOverride ? { ...rule, ...industryOverride } : rule;
      });
    }
    
    // Add jurisdiction-specific rules (future enhancement)
    // if (jurisdiction) { ... }
    
    return rules;
  }
  
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
      case 'currency':
      case 'percentage':
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }
  
  private calculateOverallScore(result: EnterpriseValidationResult): number {
    const totalFields = Object.keys(result.fieldValidation).length;
    const validFields = Object.values(result.fieldValidation).filter(f => f.isValid).length;
    
    let baseScore = (validFields / totalFields) * 100;
    
    // Deduct points for compliance issues
    baseScore -= result.complianceIssues.length * 10;
    
    // Deduct points for warnings
    baseScore -= result.warnings.length * 2;
    
    return Math.max(0, Math.min(100, baseScore));
  }
  
  private determineRiskLevel(result: EnterpriseValidationResult): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (result.complianceIssues.length > 0) return 'CRITICAL';
    if (result.errors.length > 3) return 'HIGH';
    if (result.errors.length > 0 || result.warnings.length > 2) return 'MEDIUM';
    return 'LOW';
  }
  
  private performBusinessLogicValidation(
    data: Partial<LoanData>,
    result: EnterpriseValidationResult
  ): void {
    // Cross-field validations
    if (data.facilityAmount && data.leverageCovenant) {
      const impliedDebt = data.facilityAmount * data.leverageCovenant;
      if (impliedDebt > 1000000000) { // $1B
        result.warnings.push('High implied debt level may require additional scrutiny');
      }
    }
    
    // Market-specific validations
    if (data.interestRateMargin && data.interestRateMargin > 10) {
      result.warnings.push('High interest margin may indicate distressed lending');
    }
    
    // ESG validation
    if (data.esgTarget && !data.esgTarget.toLowerCase().includes('carbon')) {
      result.warnings.push('ESG target should include carbon reduction commitments');
    }
  }
  
  private validateBaselIII(data: Partial<LoanData>, result: any): void {
    if (data.leverageCovenant && data.leverageCovenant > 6.0) {
      result.violations.push('Leverage exceeds Basel III recommended limits');
      result.isCompliant = false;
    }
  }
  
  private validateGDPR(data: Partial<LoanData>, result: any): void {
    if (data.borrowerName && data.borrowerName.length > 100) {
      result.recommendations.push('Consider data minimization for borrower information');
    }
  }
  
  private validateCECL(data: Partial<LoanData>, result: any): void {
    if (data.facilityAmount && !data.leverageCovenant) {
      result.violations.push('CECL requires comprehensive risk assessment data');
      result.isCompliant = false;
    }
  }
  
  private validateEUTaxonomy(data: Partial<LoanData>, result: any): void {
    if (!data.esgTarget || data.esgTarget.length < 20) {
      result.violations.push('EU Taxonomy requires detailed sustainability criteria');
      result.isCompliant = false;
    }
  }
}

export const enterpriseValidator = EnterpriseValidator.getInstance();

// Enhanced validation function for backward compatibility
export const validateLoanDataEnterprise = (
  data: Partial<LoanData>,
  industry?: string,
  jurisdiction?: string
): EnterpriseValidationResult => {
  return enterpriseValidator.validateLoanData(data, industry, jurisdiction);
};