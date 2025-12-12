/**
 * Integration tests for data validation and sanitization
 * Tests field validation, data sanitization, and security measures
 * Requirements: 7.2, 7.4
 */

import { 
  validateLoanData, 
  validateField, 
  sanitizeString, 
  sanitizeNumber, 
  sanitizeLoanData,
  getUserFriendlyError,
  createAPIError
} from './index';

describe('Data Validation Integration Tests', () => {
  describe('Complete Loan Data Validation', () => {
    test('should validate complete valid loan data', () => {
      const validData = {
        borrowerName: 'Acme Corporation Ltd',
        facilityAmount: 50000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: 'Reduce carbon emissions by 30% by 2030'
      };

      const result = validateLoanData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should identify all validation errors in invalid data', () => {
      const invalidData = {
        borrowerName: '', // Empty
        facilityAmount: 500000, // Too small
        currency: 'INVALID', // Not in allowed list
        interestRateMargin: 25, // Too high
        leverageCovenant: -1, // Negative
        esgTarget: 'x' // Too short
      };

      const result = validateLoanData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Borrower name is required');
      expect(result.errors.some(error => error.includes('Facility amount must be at least'))).toBe(true);
      expect(result.errors).toContain('Currency must be one of: USD, EUR, GBP, JPY, CHF, CAD, AUD, SEK, NOK, DKK');
      expect(result.errors).toContain('Interest rate margin must not exceed 20%');
      expect(result.errors).toContain('Leverage covenant must be at least 0.1x');
      expect(result.errors).toContain('ESG target must be at least 5 characters');
    });

    test('should handle edge cases in validation', () => {
      const edgeCaseData = {
        borrowerName: 'A', // Minimum length
        facilityAmount: 1000000, // Minimum amount
        currency: 'USD',
        interestRateMargin: 0.01, // Minimum rate
        leverageCovenant: 0.1, // Minimum covenant
        esgTarget: 'Valid' // Minimum ESG target length
      };

      const result = validateLoanData(edgeCaseData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle maximum values', () => {
      const maxValueData = {
        borrowerName: 'A'.repeat(200), // Maximum length
        facilityAmount: 1000000000, // Maximum amount
        currency: 'USD',
        interestRateMargin: 20.0, // Maximum rate
        leverageCovenant: 50.0, // Maximum covenant
        esgTarget: 'A'.repeat(500) // Maximum ESG target length
      };

      const result = validateLoanData(maxValueData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject values exceeding maximum limits', () => {
      const exceedingData = {
        borrowerName: 'A'.repeat(201), // Exceeds maximum
        facilityAmount: 1000000001, // Exceeds maximum
        currency: 'USD',
        interestRateMargin: 20.1, // Exceeds maximum
        leverageCovenant: 50.1, // Exceeds maximum
        esgTarget: 'A'.repeat(501) // Exceeds maximum
      };

      const result = validateLoanData(exceedingData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Borrower name must not exceed 200 characters');
      expect(result.errors.some(error => error.includes('Facility amount must not exceed'))).toBe(true);
      expect(result.errors).toContain('Interest rate margin must not exceed 20%');
      expect(result.errors).toContain('Leverage covenant must not exceed 50x');
      expect(result.errors).toContain('ESG target must not exceed 500 characters');
    });
  });

  describe('Individual Field Validation', () => {
    test('should validate borrower name field', () => {
      expect(validateField('borrowerName', 'Valid Company').isValid).toBe(true);
      expect(validateField('borrowerName', '').isValid).toBe(false);
      expect(validateField('borrowerName', '   ').isValid).toBe(false);
      expect(validateField('borrowerName', 'Company & Associates Ltd.').isValid).toBe(true);
      expect(validateField('borrowerName', 'Company<script>').isValid).toBe(false);
    });

    test('should validate facility amount field', () => {
      expect(validateField('facilityAmount', 50000000).isValid).toBe(true);
      expect(validateField('facilityAmount', 999999).isValid).toBe(false);
      expect(validateField('facilityAmount', -1000000).isValid).toBe(false);
      expect(validateField('facilityAmount', NaN).isValid).toBe(false);
      expect(validateField('facilityAmount', Infinity).isValid).toBe(false);
    });

    test('should validate currency field', () => {
      expect(validateField('currency', 'USD').isValid).toBe(true);
      expect(validateField('currency', 'EUR').isValid).toBe(true);
      expect(validateField('currency', 'INVALID').isValid).toBe(false);
      expect(validateField('currency', '').isValid).toBe(false);
      expect(validateField('currency', 'usd').isValid).toBe(false); // Case sensitive
    });

    test('should validate interest rate margin field', () => {
      expect(validateField('interestRateMargin', 2.5).isValid).toBe(true);
      expect(validateField('interestRateMargin', 0.01).isValid).toBe(true);
      expect(validateField('interestRateMargin', 20.0).isValid).toBe(true);
      expect(validateField('interestRateMargin', 0).isValid).toBe(false);
      expect(validateField('interestRateMargin', 25).isValid).toBe(false);
    });

    test('should validate leverage covenant field', () => {
      expect(validateField('leverageCovenant', 4.0).isValid).toBe(true);
      expect(validateField('leverageCovenant', 0.1).isValid).toBe(true);
      expect(validateField('leverageCovenant', 50.0).isValid).toBe(true);
      expect(validateField('leverageCovenant', 0).isValid).toBe(false);
      expect(validateField('leverageCovenant', -1).isValid).toBe(false);
    });

    test('should validate ESG target field', () => {
      expect(validateField('esgTarget', 'Reduce emissions by 30%').isValid).toBe(true);
      expect(validateField('esgTarget', 'Valid').isValid).toBe(true);
      expect(validateField('esgTarget', 'x').isValid).toBe(false);
      expect(validateField('esgTarget', '').isValid).toBe(false);
      expect(validateField('esgTarget', '   ').isValid).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize strings properly', () => {
      expect(sanitizeString('Normal text')).toBe('Normal text');
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeString('Text with "quotes" and \'apostrophes\'')).toBe('Text with quotes and apostrophes');
      expect(sanitizeString('Text   with    multiple   spaces')).toBe('Text with multiple spaces');
      expect(sanitizeString('  Leading and trailing spaces  ')).toBe('Leading and trailing spaces');
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(123 as any)).toBe('');
    });

    test('should sanitize numbers properly', () => {
      expect(sanitizeNumber(123)).toBe(123);
      expect(sanitizeNumber(123.45)).toBe(123.45);
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('123.45')).toBe(123.45);
      expect(sanitizeNumber('$123,456.78')).toBe(123456.78);
      expect(sanitizeNumber('invalid')).toBe(null);
      expect(sanitizeNumber('')).toBe(null);
      expect(sanitizeNumber(NaN)).toBe(null);
      expect(sanitizeNumber(Infinity)).toBe(null);
      expect(sanitizeNumber(-Infinity)).toBe(null);
    });

    test('should sanitize complete loan data', () => {
      const dirtyData = {
        borrowerName: '<script>Evil Corp</script>',
        facilityAmount: '$50,000,000',
        currency: 'usd',
        interestRateMargin: '2.5%',
        leverageCovenant: '4.0x',
        esgTarget: 'Reduce emissions<img src="x">'
      };

      const sanitized = sanitizeLoanData(dirtyData);

      expect(sanitized.borrowerName).toBe('scriptEvil Corp/script');
      expect(sanitized.facilityAmount).toBe(50000000);
      expect(sanitized.currency).toBe('USD');
      expect(sanitized.interestRateMargin).toBe(2.5);
      expect(sanitized.leverageCovenant).toBe(4.0);
      expect(sanitized.esgTarget).toBe('Reduce emissionsimg src=x');
    });

    test('should handle partial data sanitization', () => {
      const partialData = {
        borrowerName: 'Valid Company',
        facilityAmount: 50000000
        // Missing other fields
      };

      const sanitized = sanitizeLoanData(partialData);

      expect(sanitized.borrowerName).toBe('Valid Company');
      expect(sanitized.facilityAmount).toBe(50000000);
      expect(sanitized.currency).toBeUndefined();
      expect(sanitized.interestRateMargin).toBeUndefined();
      expect(sanitized.leverageCovenant).toBeUndefined();
      expect(sanitized.esgTarget).toBeUndefined();
    });
  });

  describe('Error Handling Utilities', () => {
    test('should create API errors properly', () => {
      const error = createAPIError('TEST_ERROR', 'Test message', { detail: 'test' });

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test('should convert API errors to user-friendly messages', () => {
      const apiKeyError = createAPIError('API_KEY_MISSING', 'No API key');
      const friendlyError = getUserFriendlyError(apiKeyError);

      expect(friendlyError.title).toBe('Configuration Error');
      expect(friendlyError.message).toContain('AI service is not configured');
      expect(friendlyError.action).toContain('Contact your administrator');
    });

    test('should handle timeout errors', () => {
      const timeoutError = createAPIError('API_TIMEOUT', 'Request timed out');
      const friendlyError = getUserFriendlyError(timeoutError);

      expect(friendlyError.title).toBe('Service Timeout');
      expect(friendlyError.message).toContain('taking too long');
      expect(friendlyError.action).toContain('try again');
    });

    test('should handle validation errors', () => {
      const validationError = createAPIError('VALIDATION_ERROR', 'Invalid data');
      const friendlyError = getUserFriendlyError(validationError);

      expect(friendlyError.title).toBe('Data Validation Error');
      expect(friendlyError.message).toContain('invalid values');
      expect(friendlyError.action).toContain('review and correct');
    });

    test('should handle network errors', () => {
      const networkError = createAPIError('NETWORK_ERROR', 'Connection failed');
      const friendlyError = getUserFriendlyError(networkError);

      expect(friendlyError.title).toBe('Connection Error');
      expect(friendlyError.message).toContain('Unable to connect');
      expect(friendlyError.action).toContain('check your internet');
    });

    test('should handle unknown errors', () => {
      const unknownError = createAPIError('UNKNOWN_ERROR', 'Something went wrong');
      const friendlyError = getUserFriendlyError(unknownError);

      expect(friendlyError.title).toBe('Unexpected Error');
      expect(friendlyError.message).toBe('Something went wrong');
      expect(friendlyError.action).toContain('try again or contact support');
    });

    test('should handle string errors', () => {
      const friendlyError = getUserFriendlyError('Simple error message');

      expect(friendlyError.title).toBe('Error');
      expect(friendlyError.message).toBe('Simple error message');
      expect(friendlyError.action).toBe('Please try again');
    });

    test('should handle Error objects', () => {
      const error = new Error('JavaScript error');
      const friendlyError = getUserFriendlyError(error);

      expect(friendlyError.title).toBe('Application Error');
      expect(friendlyError.message).toContain('unexpected error occurred');
      expect(friendlyError.action).toContain('refresh the page');
    });
  });

  describe('Security Validation', () => {
    test('should reject potentially malicious borrower names', () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        'Company & <iframe>',
        'DROP TABLE users;'
      ];

      maliciousNames.forEach(name => {
        const result = validateField('borrowerName', name);
        expect(result.isValid).toBe(false);
      });
    });

    test('should accept legitimate business names with special characters', () => {
      const legitimateNames = [
        'Johnson & Johnson Ltd.',
        'AT&T Corporation',
        'Procter & Gamble Co.',
        'Ben & Jerry\'s Holdings Inc.',
        'Marks & Spencer Group plc',
        'H&M Hennes & Mauritz AB',
        'Barnes & Noble Inc.',
        'Bed Bath & Beyond Inc.'
      ];

      legitimateNames.forEach(name => {
        const result = validateField('borrowerName', name);
        expect(result.isValid).toBe(true);
      });
    });

    test('should handle whitespace-only inputs', () => {
      const whitespaceInputs = ['   ', '\t\t', '\n\n', ' \t \n '];

      whitespaceInputs.forEach(input => {
        expect(validateField('borrowerName', input).isValid).toBe(false);
        expect(validateField('esgTarget', input).isValid).toBe(false);
      });
    });

    test('should validate numeric inputs for type safety', () => {
      const invalidNumbers = [
        'not a number',
        '123abc',
        'NaN',
        'Infinity',
        '-Infinity',
        '1e100000', // Extremely large number
        null,
        undefined,
        {},
        []
      ];

      invalidNumbers.forEach(value => {
        expect(validateField('facilityAmount', value).isValid).toBe(false);
        expect(validateField('interestRateMargin', value).isValid).toBe(false);
        expect(validateField('leverageCovenant', value).isValid).toBe(false);
      });
    });
  });
});