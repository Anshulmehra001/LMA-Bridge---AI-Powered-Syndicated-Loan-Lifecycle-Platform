'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LoanData, AnalyzeLoanResponse, validateLoanData, sanitizeLoanData } from '@/types';

// Mock data for fallback when API fails or is not configured
const MOCK_LOAN_DATA: LoanData = {
  borrowerName: "Acme Corporation Ltd",
  facilityAmount: 50000000,
  currency: "USD",
  interestRateMargin: 2.5,
  leverageCovenant: 4.0,
  esgTarget: "Reduce carbon emissions by 30% by 2030"
};

// System prompt for loan data extraction
const SYSTEM_PROMPT = `You are a loan document analyzer. Extract the following information from loan documents and return ONLY a valid JSON object with these exact fields:

{
  "borrowerName": "string - The name of the borrowing company",
  "facilityAmount": number - The total loan amount as a number (no currency symbols),
  "currency": "string - The currency code (USD, EUR, GBP, etc.)",
  "interestRateMargin": number - The interest rate margin as a percentage number (e.g., 2.5 for 2.5%),
  "leverageCovenant": number - The maximum leverage ratio as a number (e.g., 4.0 for 4.0x),
  "esgTarget": "string - Any ESG or sustainability target mentioned"
}

Rules:
- Return ONLY the JSON object, no markdown formatting, no explanations
- If a field is not found, use reasonable defaults based on typical loan structures
- Ensure all numeric values are valid numbers
- Currency should be a standard 3-letter code
- ESG target should be a descriptive string about sustainability goals

Extract from this document:`;

export async function analyzeLoan(documentText: string): Promise<AnalyzeLoanResponse> {
  try {
    // Input validation and sanitization
    if (typeof documentText !== 'string') {
      return {
        success: false, // Return false for invalid input types
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'INVALID_INPUT'
      };
    }

    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false, // Return false for empty input
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'EMPTY_INPUT'
      };
    }

    // Sanitize input text
    const sanitizedText = documentText
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();

    if (sanitizedText.length === 0) {
      return {
        success: false, // Return false for empty sanitized input
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'EMPTY_INPUT'
      };
    }

    if (sanitizedText.length > 50000) { // Reasonable limit for document size
      return {
        success: false, // Return false for oversized input
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'INPUT_TOO_LARGE'
      };
    }

    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found, using mock data');
      return {
        success: true,
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'API_KEY_MISSING'
      };
    }

    // Initialize Google Generative AI with timeout
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent extraction
        maxOutputTokens: 1000, // Limit response size
      }
    });

    // Prepare the prompt with sanitized document text
    const prompt = `${SYSTEM_PROMPT}\n\n${sanitizedText}`;

    // Generate content with timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API_TIMEOUT')), 30000); // 30 second timeout
    });

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]) as any;

    const response = await result.response;
    const text = response.text();

    // Validate response
    if (!text || text.trim().length === 0) {
      console.warn('Empty response from AI, using mock data');
      return {
        success: true,
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'EMPTY_RESPONSE'
      };
    }

    // Parse JSON response with enhanced error handling
    let extractedData: Partial<LoanData>;
    try {
      // Clean the response text to remove any markdown formatting
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*```[\s\S]*?```\s*$/g, '') // Remove any remaining code blocks
        .trim();

      if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
        throw new Error('Response is not valid JSON format');
      }

      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON:', parseError, 'Response:', text);
      return {
        success: true,
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'INVALID_RESPONSE'
      };
    }

    // Sanitize extracted data
    const sanitizedData = sanitizeLoanData(extractedData);

    // Validate the sanitized data
    const validation = validateLoanData(sanitizedData);
    if (!validation.isValid) {
      console.warn('AI extracted invalid data, using mock data. Validation errors:', validation.errors);
      return {
        success: true,
        data: MOCK_LOAN_DATA,
        isMockData: true,
        error: 'VALIDATION_ERROR',
        validationErrors: validation.errors
      };
    }

    return {
      success: true,
      data: sanitizedData as LoanData,
      isMockData: false
    };

  } catch (error: any) {
    // Enhanced error logging with sanitized information
    const errorCode = error.message === 'API_TIMEOUT' ? 'API_TIMEOUT' : 'NETWORK_ERROR';
    console.error(`Error in analyzeLoan [${errorCode}]:`, {
      message: error.message,
      name: error.name,
      // Don't log the full document text for security
      documentLength: documentText?.length || 0
    });
    
    // Return appropriate error response
    return {
      success: true, // Still return success to maintain app functionality
      data: MOCK_LOAN_DATA,
      isMockData: true,
      error: errorCode
    };
  }
}