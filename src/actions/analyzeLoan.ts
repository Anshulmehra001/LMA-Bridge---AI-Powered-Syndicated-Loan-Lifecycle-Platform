'use server';

import { LoanData, AnalyzeLoanResponse, validateLoanData, sanitizeLoanData } from '@/types';
import { SmartLoanExtractor } from '@/lib/smart-loan-extractor';

// Initialize the smart extraction engine
const extractor = new SmartLoanExtractor();

export async function analyzeLoan(documentText: string): Promise<AnalyzeLoanResponse> {
  try {
    // Import audit logger
    const { auditLogger } = await import('@/lib/audit');
    
    // Input validation and sanitization
    if (typeof documentText !== 'string') {
      await auditLogger.logDocumentAnalysis(
        String(documentText),
        false,
        undefined,
        'Invalid input type'
      );
      return {
        success: false,
        data: {} as LoanData,
        isMockData: true,
        error: 'INVALID_INPUT'
      };
    }

    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false,
        data: {} as LoanData,
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
        success: false,
        data: {} as LoanData,
        isMockData: true,
        error: 'EMPTY_INPUT'
      };
    }

    if (sanitizedText.length > 100000) { // Increased limit for better processing
      return {
        success: false,
        data: {} as LoanData,
        isMockData: true,
        error: 'INPUT_TOO_LARGE'
      };
    }

    // Use the smart extraction engine
    console.log('🤖 Using Smart AI Extraction Engine...');
    const extractionResult = await extractor.extractLoanData(sanitizedText);
    
    console.log(`✅ Smart extraction completed in ${extractionResult.processingTime}ms`);
    console.log(`📊 Confidence: ${(extractionResult.confidence * 100).toFixed(1)}%`);
    console.log(`🎯 Extracted fields: ${extractionResult.extractedFields.join(', ')}`);
    
    // Sanitize extracted data
    const sanitizedData = sanitizeLoanData(extractionResult.data);

    // Validate the sanitized data
    const validation = validateLoanData(sanitizedData);
    
    // If validation fails, still return what we extracted but mark as needing review
    if (!validation.isValid) {
      console.warn('⚠️ Some extracted data needs validation:', validation.errors);
      
      // Log the analysis attempt
      await auditLogger.logDocumentAnalysis(documentText, false, undefined, 'Validation warnings');
      
      return {
        success: true, // Still successful extraction, just needs review
        data: sanitizedData as LoanData,
        isMockData: false,
        error: 'VALIDATION_WARNING',
        validationErrors: validation.errors,
        confidence: extractionResult.confidence,
        suggestions: extractionResult.suggestions,
        processingTime: extractionResult.processingTime
      };
    }

    // Log successful analysis
    await auditLogger.logDocumentAnalysis(documentText, true);
    
    return {
      success: true,
      data: sanitizedData as LoanData,
      isMockData: false,
      confidence: extractionResult.confidence,
      suggestions: extractionResult.suggestions,
      processingTime: extractionResult.processingTime
    };

  } catch (error: any) {
    console.error('❌ Smart extraction error:', {
      message: error.message,
      name: error.name,
      documentLength: documentText?.length || 0
    });
    
    // Return fallback data with error information
    return {
      success: false,
      data: {
        borrowerName: "Document analysis failed",
        facilityAmount: 0,
        currency: "USD",
        interestRateMargin: 0,
        leverageCovenant: 0,
        esgTarget: "Unable to extract ESG information"
      } as LoanData,
      isMockData: true,
      error: 'EXTRACTION_ERROR',
      suggestions: ['Please check document format and try again', 'Ensure the document contains loan agreement information']
    };
  }
}