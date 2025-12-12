/**
 * Integration tests for error handling in analyzeLoan action
 * Tests API failure scenarios, data validation, and security measures
 * Requirements: 7.2, 7.3, 7.4
 */

import { analyzeLoan } from './analyzeLoan';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai');

const mockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('analyzeLoan Integration Tests - Error Handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('API Failure Scenarios', () => {
    test('should handle missing API key gracefully', async () => {
      // Remove API key
      delete process.env.GEMINI_API_KEY;

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('API_KEY_MISSING');
      expect(result.data).toBeDefined();
      expect(result.data?.borrowerName).toBe('Acme Corporation Ltd');
    });

    test('should handle API timeout gracefully', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const mockModel = {
        generateContent: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API_TIMEOUT')), 100);
          })
        )
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('API_TIMEOUT');
      expect(result.data).toBeDefined();
    });

    test('should handle network errors gracefully', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('NETWORK_ERROR');
      expect(result.data).toBeDefined();
    });

    test('should handle empty API response', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const mockResponse = {
        text: jest.fn().mockReturnValue('')
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('EMPTY_RESPONSE');
    });

    test('should handle invalid JSON response', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const mockResponse = {
        text: jest.fn().mockReturnValue('This is not valid JSON')
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('INVALID_RESPONSE');
    });
  });

  describe('Data Validation Error Handling', () => {
    test('should handle invalid extracted data', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const invalidData = {
        borrowerName: '', // Invalid: empty
        facilityAmount: -1000, // Invalid: negative
        currency: 'INVALID', // Invalid: not in allowed list
        interestRateMargin: 25, // Invalid: too high
        leverageCovenant: -1, // Invalid: negative
        esgTarget: '' // Invalid: empty
      };

      const mockResponse = {
        text: jest.fn().mockReturnValue(JSON.stringify(invalidData))
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.length).toBeGreaterThan(0);
    });

    test('should handle partially valid data', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const partiallyValidData = {
        borrowerName: 'Valid Company Name',
        facilityAmount: 50000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: '' // Invalid: empty
      };

      const mockResponse = {
        text: jest.fn().mockReturnValue(JSON.stringify(partiallyValidData))
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.validationErrors).toContain('ESG target is required');
    });
  });

  describe('Security Measures and Data Sanitization', () => {
    test('should reject empty input', async () => {
      const result = await analyzeLoan('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('EMPTY_INPUT');
      expect(result.isMockData).toBe(true);
    });

    test('should reject null/undefined input', async () => {
      const result = await analyzeLoan(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
      expect(result.isMockData).toBe(true);
    });

    test('should reject overly large input', async () => {
      const largeInput = 'x'.repeat(60000); // Exceeds 50KB limit

      const result = await analyzeLoan(largeInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INPUT_TOO_LARGE');
      expect(result.isMockData).toBe(true);
    });

    test('should sanitize input by removing HTML tags', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const maliciousInput = '<script>alert("xss")</script>Loan agreement text<img src="x">';

      const mockResponse = {
        text: jest.fn().mockReturnValue(JSON.stringify({
          borrowerName: 'Test Company',
          facilityAmount: 50000000,
          currency: 'USD',
          interestRateMargin: 2.5,
          leverageCovenant: 4.0,
          esgTarget: 'Reduce emissions by 30%'
        }))
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      await analyzeLoan(maliciousInput);

      // Verify that the sanitized input was passed to the API
      const calledPrompt = mockModel.generateContent.mock.calls[0][0];
      expect(calledPrompt).not.toContain('<script>');
      expect(calledPrompt).not.toContain('<img');
      expect(calledPrompt).toContain('Loan agreement text');
    });

    test('should sanitize extracted data', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const maliciousData = {
        borrowerName: '<script>alert("xss")</script>Evil Corp',
        facilityAmount: 50000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: 'Reduce emissions by 30%<img src="x">'
      };

      const mockResponse = {
        text: jest.fn().mockReturnValue(JSON.stringify(maliciousData))
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      // Since validation fails, it should fall back to mock data
      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.data?.borrowerName).toBe('Acme Corporation Ltd'); // Mock data
    });

    test('should handle numeric sanitization', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const dataWithInvalidNumbers = {
        borrowerName: 'Test Company',
        facilityAmount: '$50,000,000', // String with currency symbols
        currency: 'USD',
        interestRateMargin: '2.5%', // String with percentage
        leverageCovenant: 'four point zero', // Non-numeric string
        esgTarget: 'Reduce emissions by 30%'
      };

      const mockResponse = {
        text: jest.fn().mockReturnValue(JSON.stringify(dataWithInvalidNumbers))
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      // Should fall back to mock data due to sanitization issues
      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
    });
  });

  describe('Successful Processing', () => {
    test('should process valid data successfully', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const validData = {
        borrowerName: 'Acme Corporation',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 3.0,
        leverageCovenant: 4.5,
        esgTarget: 'Achieve carbon neutrality by 2030'
      };

      const mockResponse = {
        text: jest.fn().mockReturnValue(JSON.stringify(validData))
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(validData);
    });

    test('should handle markdown-formatted JSON response', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const validData = {
        borrowerName: 'Acme Corporation',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 3.0,
        leverageCovenant: 4.5,
        esgTarget: 'Achieve carbon neutrality by 2030'
      };

      const markdownResponse = `\`\`\`json\n${JSON.stringify(validData)}\n\`\`\``;

      const mockResponse = {
        text: jest.fn().mockReturnValue(markdownResponse)
      };

      const mockResult = {
        response: Promise.resolve(mockResponse)
      };

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResult)
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await analyzeLoan('Sample loan document text');

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(false);
      expect(result.data).toEqual(validData);
    });
  });
});