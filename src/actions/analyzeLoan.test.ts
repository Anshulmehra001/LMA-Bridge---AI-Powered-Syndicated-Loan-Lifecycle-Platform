/**
 * **Feature: lma-bridge, Property 1: AI extraction completeness**
 * **Validates: Requirements 1.2**
 * 
 * **Feature: lma-bridge, Property 2: Error handling with fallback**
 * **Validates: Requirements 1.4, 7.3**
 * 
 * Property-based tests for AI integration server action
 */

import * as fc from 'fast-check';
import { analyzeLoan } from './analyzeLoan';
import { LoanData } from '@/types';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

describe('AI Integration Server Action', () => {
  // Store original environment variable
  const originalApiKey = process.env.GEMINI_API_KEY;
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Suppress console.error and console.warn during tests to prevent property test failures
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore original environment variable and console methods
    process.env.GEMINI_API_KEY = originalApiKey;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    jest.clearAllMocks();
  });

  describe('Property 1: AI extraction completeness', () => {
    it('should return all six required fields with valid data types for any loan document text input', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various document text inputs (non-whitespace only)
          fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
          async (documentText: string) => {
            // Set up API key for this test
            process.env.GEMINI_API_KEY = 'test-api-key';

            // Mock successful AI response with valid loan data
            const mockLoanData: LoanData = {
              borrowerName: "Test Corporation Ltd",
              facilityAmount: 25000000,
              currency: "USD",
              interestRateMargin: 3.5,
              leverageCovenant: 5.0,
              esgTarget: "Achieve carbon neutrality by 2035"
            };

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const mockModel = {
              generateContent: jest.fn().mockResolvedValue({
                response: {
                  text: () => JSON.stringify(mockLoanData)
                }
              })
            };
            GoogleGenerativeAI.mockImplementation(() => ({
              getGenerativeModel: () => mockModel
            }));

            const result = await analyzeLoan(documentText);

            // Property: Result should always be successful
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();

            if (result.data) {
              // Property: All six required fields should be present
              expect(result.data).toHaveProperty('borrowerName');
              expect(result.data).toHaveProperty('facilityAmount');
              expect(result.data).toHaveProperty('currency');
              expect(result.data).toHaveProperty('interestRateMargin');
              expect(result.data).toHaveProperty('leverageCovenant');
              expect(result.data).toHaveProperty('esgTarget');

              // Property: All fields should have correct data types
              expect(typeof result.data.borrowerName).toBe('string');
              expect(typeof result.data.facilityAmount).toBe('number');
              expect(typeof result.data.currency).toBe('string');
              expect(typeof result.data.interestRateMargin).toBe('number');
              expect(typeof result.data.leverageCovenant).toBe('number');
              expect(typeof result.data.esgTarget).toBe('string');

              // Property: Numeric fields should be valid numbers (not NaN or Infinity)
              expect(isFinite(result.data.facilityAmount)).toBe(true);
              expect(isFinite(result.data.interestRateMargin)).toBe(true);
              expect(isFinite(result.data.leverageCovenant)).toBe(true);

              // Property: String fields should not be empty
              expect(result.data.borrowerName.length).toBeGreaterThan(0);
              expect(result.data.currency.length).toBeGreaterThan(0);
              expect(result.data.esgTarget.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malformed AI responses by falling back to mock data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.oneof(
            fc.constant('invalid json'),
            fc.constant('```json\n{"incomplete": true}\n```'),
            fc.constant('{"borrowerName": "test"}'), // Missing required fields
            fc.constant('') // Empty response
          ),
          async (documentText: string, malformedResponse: string) => {
            process.env.GEMINI_API_KEY = 'test-api-key';

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const mockModel = {
              generateContent: jest.fn().mockResolvedValue({
                response: {
                  text: () => malformedResponse
                }
              })
            };
            GoogleGenerativeAI.mockImplementation(() => ({
              getGenerativeModel: () => mockModel
            }));

            const result = await analyzeLoan(documentText);

            // Property: Should still return successful result with mock data
            expect(result.success).toBe(true);
            expect(result.isMockData).toBe(true);
            expect(result.data).toBeDefined();

            if (result.data) {
              // Property: Mock data should have all required fields with valid types
              expect(typeof result.data.borrowerName).toBe('string');
              expect(typeof result.data.facilityAmount).toBe('number');
              expect(typeof result.data.currency).toBe('string');
              expect(typeof result.data.interestRateMargin).toBe('number');
              expect(typeof result.data.leverageCovenant).toBe('number');
              expect(typeof result.data.esgTarget).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Error handling with fallback', () => {
    it('should provide mock data and continue functioning for any API failure or missing configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 1000 }).filter(s => {
            const sanitized = s.replace(/[<>]/g, '').trim();
            return sanitized.length >= 1;
          }),
          fc.oneof(
            fc.constant(undefined), // Missing API key
            fc.constant(''), // Empty API key
            fc.constant('invalid-key') // Invalid API key that will cause errors
          ),
          async (documentText: string, apiKey: string | undefined) => {
            // Set up the API key scenario
            if (apiKey === undefined) {
              delete process.env.GEMINI_API_KEY;
            } else {
              process.env.GEMINI_API_KEY = apiKey;
            }

            // Mock API to throw errors when called with invalid key
            if (apiKey && apiKey !== '') {
              const { GoogleGenerativeAI } = require('@google/generative-ai');
              const mockModel = {
                generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
              };
              GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: () => mockModel
              }));
            }

            const result = await analyzeLoan(documentText);

            // Property: Should never fail, always return successful result
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();

            // Property: When API fails, should use mock data
            if (!apiKey || apiKey === '' || apiKey === 'invalid-key') {
              expect(result.isMockData).toBe(true);
            }

            // Property: Mock data should always be valid and complete
            if (result.data) {
              expect(result.data.borrowerName).toBeDefined();
              expect(result.data.facilityAmount).toBeDefined();
              expect(result.data.currency).toBeDefined();
              expect(result.data.interestRateMargin).toBeDefined();
              expect(result.data.leverageCovenant).toBeDefined();
              expect(result.data.esgTarget).toBeDefined();

              // Property: Mock data should pass validation
              expect(typeof result.data.borrowerName).toBe('string');
              expect(typeof result.data.facilityAmount).toBe('number');
              expect(typeof result.data.currency).toBe('string');
              expect(typeof result.data.interestRateMargin).toBe('number');
              expect(typeof result.data.leverageCovenant).toBe('number');
              expect(typeof result.data.esgTarget).toBe('string');

              expect(result.data.borrowerName.length).toBeGreaterThan(0);
              expect(result.data.facilityAmount).toBeGreaterThan(0);
              expect(result.data.currency.length).toBeGreaterThan(0);
              expect(result.data.interestRateMargin).toBeGreaterThan(0);
              expect(result.data.leverageCovenant).toBeGreaterThan(0);
              expect(result.data.esgTarget.length).toBeGreaterThan(0);
            }

            // Property: Error codes are allowed for debugging but should not contain sensitive info
            if (result.error) {
              expect(typeof result.error).toBe('string');
              expect(result.error).toMatch(/^(API_KEY_MISSING|API_TIMEOUT|NETWORK_ERROR|VALIDATION_ERROR|EMPTY_RESPONSE|INVALID_RESPONSE)$/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle network timeouts and API rate limits gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.constantFrom(
            'TIMEOUT_ERROR',
            'RATE_LIMIT_ERROR', 
            'NETWORK_ERROR',
            'INVALID_RESPONSE_ERROR'
          ),
          async (documentText: string, errorType: string) => {
            process.env.GEMINI_API_KEY = 'test-api-key';

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            
            let mockError: Error;
            switch (errorType) {
              case 'TIMEOUT_ERROR':
                mockError = new Error('Request timeout');
                break;
              case 'RATE_LIMIT_ERROR':
                mockError = new Error('Rate limit exceeded');
                break;
              case 'NETWORK_ERROR':
                mockError = new Error('Network error');
                break;
              default:
                mockError = new Error('Invalid response format');
            }

            const mockModel = {
              generateContent: jest.fn().mockRejectedValue(mockError)
            };
            GoogleGenerativeAI.mockImplementation(() => ({
              getGenerativeModel: () => mockModel
            }));

            const result = await analyzeLoan(documentText);

            // Property: Should gracefully handle all error types
            expect(result.success).toBe(true);
            expect(result.isMockData).toBe(true);
            expect(result.data).toBeDefined();
            // Property: Error codes are allowed for debugging but should not contain sensitive info
            if (result.error) {
              expect(typeof result.error).toBe('string');
              expect(result.error).toMatch(/^(API_KEY_MISSING|API_TIMEOUT|NETWORK_ERROR|VALIDATION_ERROR|EMPTY_RESPONSE|INVALID_RESPONSE)$/);
            }

            // Property: Fallback data should be complete and valid
            if (result.data) {
              const requiredFields = ['borrowerName', 'facilityAmount', 'currency', 'interestRateMargin', 'leverageCovenant', 'esgTarget'];
              requiredFields.forEach(field => {
                expect(result.data).toHaveProperty(field);
                expect(result.data![field as keyof LoanData]).toBeDefined();
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});