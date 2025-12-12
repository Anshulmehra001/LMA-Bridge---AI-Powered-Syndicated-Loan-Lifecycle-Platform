/**
 * **Feature: lma-bridge, Property 7: Data validation integrity**
 * **Validates: Requirements 1.5, 7.4**
 * 
 * Property-based tests for data model validation
 */

import * as fc from 'fast-check';
import { 
  validateLoanData, 
  validateField, 
  loanDataValidationSchema,
  LoanData 
} from './index';

describe('Data Model Validation', () => {
  describe('Property 7: Data validation integrity', () => {
    it('should validate all fields before populating forms or updating state, ensuring type safety and format compliance', () => {
      fc.assert(
        fc.property(
          // Generate valid loan data
          fc.record({
            borrowerName: fc.string({ minLength: 1, maxLength: 200 })
              .filter(s => /^[a-zA-Z0-9\s\-&.,()]+$/.test(s) && s.trim().length > 0),
            facilityAmount: fc.integer({ 
              min: loanDataValidationSchema.facilityAmount.min, 
              max: loanDataValidationSchema.facilityAmount.max 
            }),
            currency: fc.constantFrom(...loanDataValidationSchema.currency.validCurrencies),
            interestRateMargin: fc.float({ 
              min: Math.fround(0.02), 
              max: Math.fround(19.0) 
            }).filter(n => !isNaN(n) && isFinite(n)),
            leverageCovenant: fc.float({ 
              min: Math.fround(0.2), 
              max: Math.fround(49.0) 
            }).filter(n => !isNaN(n) && isFinite(n)),
            esgTarget: fc.string({ 
              minLength: loanDataValidationSchema.esgTarget.minLength, 
              maxLength: loanDataValidationSchema.esgTarget.maxLength 
            }).filter(s => s.trim().length >= loanDataValidationSchema.esgTarget.minLength)
          }),
          (validLoanData: LoanData) => {
            // Property: Valid data should always pass validation
            const result = validateLoanData(validLoanData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid borrower names with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''), // Empty string
            fc.string({ minLength: 201 }), // Too long
            fc.string().filter(s => s.length > 0 && !/^[a-zA-Z0-9\s\-&.,()'\u00C0-\u017F]+$/.test(s)) // Invalid characters
          ),
          (invalidBorrowerName: string) => {
            const result = validateField('borrowerName', invalidBorrowerName);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('Borrower name'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid facility amounts with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: loanDataValidationSchema.facilityAmount.min - 1 }), // Too small
            fc.integer({ min: loanDataValidationSchema.facilityAmount.max + 1 }), // Too large
            fc.constantFrom(NaN, Infinity, -Infinity), // Invalid numbers
            fc.string() // Non-numeric
          ),
          (invalidAmount: any) => {
            const result = validateField('facilityAmount', invalidAmount);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('Facility amount'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid currencies with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''), // Empty string
            fc.string().filter(s => !loanDataValidationSchema.currency.validCurrencies.includes(s)), // Invalid currency
            fc.constantFrom('INVALID', 'XXX', '123') // Specific invalid examples
          ),
          (invalidCurrency: string) => {
            const result = validateField('currency', invalidCurrency);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('Currency'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid interest rate margins with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.float({ max: Math.fround(loanDataValidationSchema.interestRateMargin.min - 0.001) }), // Too small
            fc.float({ min: Math.fround(loanDataValidationSchema.interestRateMargin.max + 0.001) }), // Too large
            fc.constantFrom(NaN, Infinity, -Infinity), // Invalid numbers
            fc.string() // Non-numeric
          ),
          (invalidMargin: any) => {
            const result = validateField('interestRateMargin', invalidMargin);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('Interest rate margin'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid leverage covenants with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.float({ max: Math.fround(loanDataValidationSchema.leverageCovenant.min - 0.001) }), // Too small
            fc.float({ min: Math.fround(loanDataValidationSchema.leverageCovenant.max + 0.001) }), // Too large
            fc.constantFrom(NaN, Infinity, -Infinity), // Invalid numbers
            fc.string() // Non-numeric
          ),
          (invalidCovenant: any) => {
            const result = validateField('leverageCovenant', invalidCovenant);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('Leverage covenant'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid ESG targets with appropriate error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''), // Empty string
            fc.string({ maxLength: loanDataValidationSchema.esgTarget.minLength - 1 }), // Too short
            fc.string({ minLength: loanDataValidationSchema.esgTarget.maxLength + 1 }) // Too long
          ),
          (invalidTarget: string) => {
            const result = validateField('esgTarget', invalidTarget);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('ESG target'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle partial data validation correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            borrowerName: fc.option(fc.string({ minLength: 1, maxLength: 200 })
              .filter(s => /^[a-zA-Z0-9\s\-&.,()]+$/.test(s) && s.trim().length > 0), { nil: undefined }),
            facilityAmount: fc.option(fc.integer({ 
              min: loanDataValidationSchema.facilityAmount.min, 
              max: loanDataValidationSchema.facilityAmount.max 
            }), { nil: undefined }),
            currency: fc.option(fc.constantFrom(...loanDataValidationSchema.currency.validCurrencies), { nil: undefined })
          }, { requiredKeys: [] }),
          (partialData: Partial<LoanData>) => {
            const result = validateLoanData(partialData);
            
            // If all provided fields are valid, but some required fields are missing,
            // validation should fail due to missing required fields
            const providedFields = Object.keys(partialData).filter(key => partialData[key as keyof LoanData] !== undefined);
            const allRequiredFields = ['borrowerName', 'facilityAmount', 'currency', 'interestRateMargin', 'leverageCovenant', 'esgTarget'];
            const missingRequiredFields = allRequiredFields.filter(field => !providedFields.includes(field));
            
            if (missingRequiredFields.length > 0) {
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});