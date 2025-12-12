'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorNotification } from '@/components/ui/error-notification';
// import { ValidatedInput } from '@/components/ui/validated-input';
import { useApplication } from '@/contexts/ApplicationContext';
import { analyzeLoan } from '@/actions/analyzeLoan';
import { LoanData, getUserFriendlyError, createAPIError, validateLoanData } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';

// Sample loan agreement clause for demo mode
const DEMO_LOAN_AGREEMENT = `CREDIT AGREEMENT

This Credit Agreement ("Agreement") is entered into as of December 11, 2024, between ACME CORPORATION, a Delaware corporation (the "Borrower"), and the lenders party hereto (the "Lenders").

ARTICLE I - CREDIT FACILITY
The Lenders agree to provide a revolving credit facility in the aggregate principal amount of $250,000,000 (the "Facility Amount") denominated in United States Dollars (USD).

ARTICLE II - INTEREST AND FEES
The Borrower shall pay interest on the outstanding principal amount of each loan at a rate per annum equal to the Base Rate plus 2.75% per annum (the "Interest Rate Margin").

ARTICLE III - FINANCIAL COVENANTS
The Borrower shall maintain at all times a Total Leverage Ratio not to exceed 4.50:1.00 as of the end of each fiscal quarter.

ARTICLE IV - ESG COMMITMENTS
The Borrower commits to achieving a 25% reduction in carbon emissions by 2027 and maintaining an ESG rating of B+ or higher from recognized rating agencies.

ARTICLE V - REPRESENTATIONS AND WARRANTIES
The Borrower represents and warrants that all information provided is true and accurate as of the date hereof.`;

// Demo data that matches the sample agreement
const DEMO_LOAN_DATA: LoanData = {
  borrowerName: 'ACME Corporation',
  facilityAmount: 250000000,
  currency: 'USD',
  interestRateMargin: 2.75,
  leverageCovenant: 4.5,
  esgTarget: '25% reduction in carbon emissions by 2027 and maintain ESG rating of B+ or higher'
};

export function OriginationTab() {
  const { state, setLoanData, verifyAndLockData } = useApplication();
  const [documentText, setDocumentText] = useState('');
  const [extractedData, setExtractedData] = useState<LoanData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid] = useState(true);
  const [showMockDataWarning, setShowMockDataWarning] = useState(false);

  // Handle demo mode changes
  useEffect(() => {
    if (state.demoMode) {
      // Pre-fill with demo data when demo mode is enabled
      if (documentText !== DEMO_LOAN_AGREEMENT) {
        setDocumentText(DEMO_LOAN_AGREEMENT);
      }
      if (!extractedData || extractedData.borrowerName !== DEMO_LOAN_DATA.borrowerName) {
        setExtractedData(DEMO_LOAN_DATA);
      }
    } else {
      // Clear data when demo mode is disabled
      if (documentText === DEMO_LOAN_AGREEMENT) {
        setDocumentText('');
      }
      if (extractedData && extractedData.borrowerName === DEMO_LOAN_DATA.borrowerName) {
        setExtractedData(null);
      }
    }
  }, [state.demoMode]); // Remove documentText and extractedData from dependencies to avoid infinite loops

  const handleAnalyze = () => {
    if (!documentText.trim()) {
      setError('Please enter loan document text before analyzing.');
      return;
    }

    // Clear previous errors
    setError(null);
    setValidationErrors([]);
    setShowMockDataWarning(false);

    startTransition(async () => {
      try {
        if (state.demoMode) {
          // In demo mode, use the predefined demo data
          setExtractedData(DEMO_LOAN_DATA);
          setShowMockDataWarning(true);
        } else {
          // In normal mode, call the AI service
          const result = await analyzeLoan(documentText);
          
          if (result && result.success && result.data) {
            setExtractedData(result.data);
            
            // Show warning if mock data was used due to API issues
            if (result.isMockData && result.error) {
              const friendlyError = getUserFriendlyError(createAPIError(result.error, 'AI service unavailable'));
              setError(`${friendlyError.title}: ${friendlyError.message}`);
              setShowMockDataWarning(true);
            }
            
            // Show validation errors if any
            if (result.validationErrors && result.validationErrors.length > 0) {
              setValidationErrors(result.validationErrors);
            }
          } else {
            // Handle failure case
            const errorCode = result?.error || 'UNKNOWN_ERROR';
            const friendlyError = getUserFriendlyError(createAPIError(errorCode, 'Analysis failed'));
            setError(`${friendlyError.title}: ${friendlyError.message}`);
            
            if (result?.data) {
              setExtractedData(result.data);
              setShowMockDataWarning(true);
            } else {
              // Fallback to demo data if no result data
              setExtractedData(DEMO_LOAN_DATA);
              setShowMockDataWarning(true);
            }
          }
        }
      } catch (error) {
        console.error('Error analyzing loan:', error);
        const friendlyError = getUserFriendlyError(error as Error);
        setError(`${friendlyError.title}: ${friendlyError.message}`);
        
        // Fallback to demo data on error
        setExtractedData(DEMO_LOAN_DATA);
        setShowMockDataWarning(true);
      }
    });
  };

  const handleVerifyAndLock = () => {
    if (!extractedData) {
      setError('No data available to verify. Please analyze a document first.');
      return;
    }

    // Validate data before locking
    const validation = validateLoanData(extractedData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Cannot verify data with validation errors. Please correct the highlighted issues.');
      return;
    }

    // Clear errors and proceed with verification
    setError(null);
    setValidationErrors([]);
    setLoanData(extractedData);
    verifyAndLockData();
  };

  const handleRetryAnalysis = () => {
    setError(null);
    setValidationErrors([]);
    setShowMockDataWarning(false);
    handleAnalyze();
  };

  const handleDismissError = () => {
    setError(null);
  };

  const isVerified = state.verificationStatus.isVerified;
  const isLocked = state.verificationStatus.isLocked;
  const currentLoan = state.currentLoan || extractedData;

  return (
    <div className="space-y-4">
      {/* Error Notifications */}
      {error && (
        <ErrorNotification
          error={getUserFriendlyError(error)}
          onDismiss={handleDismissError}
          onRetry={handleRetryAnalysis}
        />
      )}

      {/* Mock Data Warning */}
      {showMockDataWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                Using Demo Data
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {state.demoMode 
                  ? 'Demo mode is active. Using sample loan data for demonstration.'
                  : 'AI service is unavailable. Using fallback data to continue.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Data Validation Issues:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-center">
                <AlertTriangle className="w-3 h-3 mr-2 flex-shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
        {/* Left Panel - Document Input */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-900">
              Loan Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea
              placeholder="Paste your loan agreement text here for AI analysis..."
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="flex-1 min-h-[300px] resize-none"
              disabled={isLocked}
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleAnalyze}
                disabled={!documentText.trim() || isPending || isLocked}
                className="rounded-md"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Right Panel - Extracted Data Form */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-slate-900">
            Loan Data
          </CardTitle>
          {isVerified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse-success">
              Verified
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Borrower Name
            </label>
            <Input
              value={currentLoan?.borrowerName || ''}
              readOnly
              className={`transition-all duration-300 ${
                extractedData && !isVerified ? 'bg-blue-50 border-blue-200 animate-slide-in' : ''
              } ${isLocked ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Facility Amount
              </label>
              <Input
                value={currentLoan?.facilityAmount?.toLocaleString() || ''}
                readOnly
                className={`transition-all duration-300 ${
                  extractedData && !isVerified ? 'bg-blue-50 border-blue-200 animate-slide-in' : ''
                } ${isLocked ? 'bg-gray-50' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Currency
              </label>
              <Input
                value={currentLoan?.currency || ''}
                readOnly
                className={`transition-all duration-300 ${
                  extractedData && !isVerified ? 'bg-blue-50 border-blue-200 animate-slide-in' : ''
                } ${isLocked ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Interest Rate Margin (%)
            </label>
            <Input
              value={currentLoan?.interestRateMargin || ''}
              readOnly
              className={`transition-all duration-300 ${
                extractedData && !isVerified ? 'bg-blue-50 border-blue-200 animate-slide-in' : ''
              } ${isLocked ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Leverage Covenant
            </label>
            <Input
              value={currentLoan?.leverageCovenant || ''}
              readOnly
              className={`transition-all duration-300 ${
                extractedData && !isVerified ? 'bg-blue-50 border-blue-200 animate-slide-in' : ''
              } ${isLocked ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              ESG Target
            </label>
            <Textarea
              value={currentLoan?.esgTarget || ''}
              readOnly
              className={`transition-all duration-300 ${
                extractedData && !isVerified ? 'bg-blue-50 border-blue-200 animate-slide-in' : ''
              } ${isLocked ? 'bg-gray-50' : ''} min-h-[80px]`}
            />
          </div>

          {extractedData && !isVerified && (
            <div className="pt-4 animate-fade-in">
              <Button
                onClick={handleVerifyAndLock}
                className="w-full rounded-md transition-all duration-200 hover:scale-105"
                variant="default"
                disabled={!isFormValid || validationErrors.length > 0}
              >
                Verify & Lock
              </Button>
              {(!isFormValid || validationErrors.length > 0) && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  Please correct validation errors before verifying
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}