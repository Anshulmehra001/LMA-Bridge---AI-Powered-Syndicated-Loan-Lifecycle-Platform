'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeLoan } from '@/actions/analyzeLoan';
import { LoanData, validateLoanData } from '@/types';
import { Loader2, CheckCircle, AlertTriangle, Upload, FileText, Building, DollarSign, Percent, TrendingUp, Leaf } from 'lucide-react';
import { useApplication } from '@/contexts/ApplicationContext';

export function OriginationTab() {
  const { setLoanData, verifyAndLockData, state } = useApplication();
  const [documentText, setDocumentText] = useState('');
  const [extractedData, setExtractedData] = useState<LoanData | null>(null);
  const [manualData, setManualData] = useState<LoanData>({
    borrowerName: '',
    facilityAmount: 0,
    currency: 'USD',
    interestRateMargin: 0,
    leverageCovenant: 0,
    esgTarget: ''
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inputMode, setInputMode] = useState<'document' | 'manual'>('document');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processingStats, setProcessingStats] = useState<{
    confidence?: number;
    processingTime?: number;
    extractedFields?: string[];
  }>({});

  // Clear errors on component mount and when switching modes
  useEffect(() => {
    setError(null);
    setValidationErrors([]);
    setSuccess(false);
  }, [inputMode]);

  // Clear errors when document text changes (user is typing)
  useEffect(() => {
    if (documentText.trim() && error === 'Please enter loan document text before analyzing.') {
      setError(null);
    }
  }, [documentText, error]);

  const handleAnalyze = () => {
    // Clear any previous errors first
    setError(null);
    setValidationErrors([]);
    
    if (!documentText.trim()) {
      setError('Please enter loan document text before analyzing.');
      return;
    }

    setSuccess(false);
    setProcessingStats({});

    startTransition(async () => {
      try {
        const result = await analyzeLoan(documentText);
        
        if (result && result.success && result.data) {
          setExtractedData(result.data);
          setProcessingStats({
            confidence: result.confidence,
            processingTime: result.processingTime,
            extractedFields: result.extractedFields
          });
          
          if (!result.isMockData) {
            setSuccess(true);
          } else if (result.error && result.error !== 'VALIDATION_WARNING') {
            setError('AI service unavailable, using smart extraction engine');
          }

          if (result.validationErrors && result.validationErrors.length > 0) {
            setValidationErrors(result.validationErrors);
          }
        } else {
          setError('Analysis failed. Please try again.');
        }
      } catch (error) {
        console.error('Error analyzing loan:', error);
        setError('Analysis failed. Please try again.');
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { processDocument, validateFile } = await import('@/lib/document-processor');

      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        event.target.value = '';
        return;
      }

      setError(null);
      setSuccess(false);
      
      const processingMessage = `Processing ${file.name}...`;
      setError(processingMessage);
      
      const processedDoc = await processDocument(file);
      setDocumentText(processedDoc.text);
      setError(null);
      
      if (processedDoc.text.trim()) {
        setTimeout(() => {
          handleAnalyze();
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setError(`Document processing failed: ${errorMessage}. You can try copying the text content and pasting it directly.`);
    } finally {
      event.target.value = '';
    }
  };

  const handleUseSample = () => {
    const sampleDoc = `REVOLVING CREDIT AGREEMENT

This Revolving Credit Agreement ("Agreement") is entered into as of December 15, 2025, between TECHCORP INDUSTRIES INC., a Delaware corporation (the "Borrower"), and the lenders party hereto (the "Lenders").

ARTICLE I - CREDIT FACILITY

The Lenders agree to provide a revolving credit facility in the aggregate principal amount of FIVE HUNDRED MILLION DOLLARS ($500,000,000) (the "Facility Amount") denominated in United States Dollars (USD).

ARTICLE II - INTEREST AND FEES

The Borrower shall pay interest on the outstanding principal amount of each loan at a rate per annum equal to the Secured Overnight Financing Rate (SOFR) plus 2.75% per annum (the "Interest Rate Margin").

ARTICLE III - MATURITY AND REPAYMENT

The facility shall mature on December 15, 2030, at which time all outstanding principal and accrued interest shall be due and payable in full.

ARTICLE IV - FINANCIAL COVENANTS

The Borrower shall maintain at all times:
- A Total Leverage Ratio not to exceed 4.25:1.00 as of the end of each fiscal quarter
- A Minimum Interest Coverage Ratio of not less than 3.50:1.00 as of the end of each fiscal quarter
- A Minimum Liquidity of not less than $50,000,000 at all times

ARTICLE V - ESG COMMITMENTS

The Borrower commits to:
- Reduce carbon emissions by 30% by 2027
- Achieve 50% renewable energy usage by 2026
- Maintain ESG rating of B+ or higher from recognized agencies

ARTICLE VI - REPRESENTATIONS AND WARRANTIES

The Borrower represents and warrants that it is duly organized and validly existing under the laws of Delaware and has full corporate power and authority to execute and deliver this Agreement.`;
    
    setDocumentText(sampleDoc);
    setError(null);
    setSuccess(false);
    setValidationErrors([]);
    setProcessingStats({});
  };

  const handleManualDataChange = (field: keyof LoanData, value: string | number) => {
    setManualData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSwitchToManual = () => {
    setInputMode('manual');
    setError(null);
    setSuccess(false);
    setValidationErrors([]);
  };

  const handleSwitchToDocument = () => {
    setInputMode('document');
    setError(null);
    setSuccess(false);
    setValidationErrors([]);
  };

  const handleManualSubmit = () => {
    const validation = validateLoanData(manualData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Please correct the validation errors before submitting.');
      return;
    }

    setExtractedData(manualData);
    setSuccess(true);
    setError(null);
    setValidationErrors([]);
  };

  const handleVerifyAndLock = () => {
    if (extractedData) {
      setLoanData(extractedData);
      verifyAndLockData();
      setSuccess(true);
      setError(null);
    }
  };

  const currentData = inputMode === 'manual' ? manualData : extractedData;
  const isDataReady = currentData && currentData.borrowerName && currentData.facilityAmount > 0;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Loan Origination</h2>
          <p className="text-slate-600 mt-1">Create and analyze loan agreements with AI-powered extraction</p>
        </div>
        {state.verificationStatus.isVerified && (
          <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Verified & Locked</span>
          </div>
        )}
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-4">
        <button
          className={`flex-1 px-6 py-5 rounded-xl border-2 transition-all duration-300 ${
            inputMode === 'document' 
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg' 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'
          }`}
          onClick={handleSwitchToDocument}
        >
          <div className="flex items-center justify-center space-x-3">
            <div className={`p-2 rounded-lg ${inputMode === 'document' ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">AI Document Analysis</div>
              <div className="text-sm opacity-75">Upload or paste loan agreements</div>
            </div>
          </div>
        </button>
        <button
          className={`flex-1 px-6 py-5 rounded-xl border-2 transition-all duration-300 ${
            inputMode === 'manual' 
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-lg' 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'
          }`}
          onClick={handleSwitchToManual}
        >
          <div className="flex items-center justify-center space-x-3">
            <div className={`p-2 rounded-lg ${inputMode === 'manual' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">Manual Data Entry</div>
              <div className="text-sm opacity-75">Enter loan details directly</div>
            </div>
          </div>
        </button>
      </div>

      {/* Status Messages - Only show when relevant */}
      {success && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-center shadow-sm animate-fade-in">
          <div className="p-2 bg-emerald-100 rounded-lg mr-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-emerald-800 font-semibold">
              {inputMode === 'manual' ? 'Data entered successfully' : 'Document analyzed successfully'}
            </span>
            {processingStats.confidence && (
              <span className="text-emerald-700 ml-2">
                (Confidence: {(processingStats.confidence * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {error && error !== 'Please enter loan document text before analyzing.' && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 flex items-center shadow-sm animate-fade-in">
          <div className="p-2 bg-red-100 rounded-lg mr-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* Show validation error only when user tries to analyze empty document */}
      {error === 'Please enter loan document text before analyzing.' && inputMode === 'document' && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center shadow-sm animate-fade-in">
          <div className="p-2 bg-amber-100 rounded-lg mr-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-amber-800 font-medium">{error}</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="text-amber-800">
            <span className="font-semibold">Validation notes: </span>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <Card className="h-full flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2 text-slate-800">
              {inputMode === 'document' ? (
                <>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Document Analysis</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span>Manual Entry</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4 p-6">
            {inputMode === 'document' ? (
              <>
                {/* File Upload */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-xl font-semibold text-slate-900 block">Upload Document</span>
                    <span className="text-slate-600 mt-1 block">PDF, Word, or text files up to 10MB</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-4 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                  >
                    Choose File
                  </Button>
                </div>

                {/* Text Area */}
                <div className="flex-1">
                  <Textarea
                    placeholder="Or paste loan agreement text here..."
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    className="w-full h-64 resize-none border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <Button
                    onClick={handleUseSample}
                    variant="outline"
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Use Sample Document
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!documentText.trim() || isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Analyze Document
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Manual Entry Form */}
                <div className="space-y-5 flex-1">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                        <Building className="w-4 h-4 text-slate-600" />
                      </div>
                      Borrower Name *
                    </label>
                    <Input
                      value={manualData.borrowerName}
                      onChange={(e) => handleManualDataChange('borrowerName', e.target.value)}
                      placeholder="Enter company name"
                      className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                        <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                          <DollarSign className="w-4 h-4 text-slate-600" />
                        </div>
                        Facility Amount *
                      </label>
                      <Input
                        type="number"
                        value={manualData.facilityAmount || ''}
                        onChange={(e) => handleManualDataChange('facilityAmount', parseFloat(e.target.value) || 0)}
                        placeholder="500000000"
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-3 block">Currency *</label>
                      <select
                        value={manualData.currency}
                        onChange={(e) => handleManualDataChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                        <option value="CHF">CHF</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                        <Percent className="w-4 h-4 text-slate-600" />
                      </div>
                      Interest Rate Margin (%) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={manualData.interestRateMargin || ''}
                      onChange={(e) => handleManualDataChange('interestRateMargin', parseFloat(e.target.value) || 0)}
                      placeholder="2.75"
                      className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                        <TrendingUp className="w-4 h-4 text-slate-600" />
                      </div>
                      Leverage Covenant *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={manualData.leverageCovenant || ''}
                      onChange={(e) => handleManualDataChange('leverageCovenant', parseFloat(e.target.value) || 0)}
                      placeholder="4.25"
                      className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                        <Leaf className="w-4 h-4 text-slate-600" />
                      </div>
                      ESG Target
                    </label>
                    <Textarea
                      value={manualData.esgTarget}
                      onChange={(e) => handleManualDataChange('esgTarget', e.target.value)}
                      placeholder="Enter ESG commitments and targets..."
                      className="min-h-[80px] resize-none border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualData.borrowerName || !manualData.facilityAmount}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Data
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Right Panel - Results */}
        <Card className="h-full flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <span>Extracted Data</span>
              </div>
              {processingStats.confidence && (
                <span className="text-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-full font-medium">
                  {(processingStats.confidence * 100).toFixed(1)}% confidence
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-5 p-6">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                    <Building className="w-4 h-4 text-slate-600" />
                  </div>
                  Borrower Name
                </label>
                <Input
                  value={currentData?.borrowerName || ''}
                  readOnly
                  className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                      <DollarSign className="w-4 h-4 text-slate-600" />
                    </div>
                    Amount
                  </label>
                  <Input
                    value={currentData?.facilityAmount?.toLocaleString() || ''}
                    readOnly
                    className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">Currency</label>
                  <Input
                    value={currentData?.currency || ''}
                    readOnly
                    className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                    <Percent className="w-4 h-4 text-slate-600" />
                  </div>
                  Rate Margin (%)
                </label>
                <Input
                  value={currentData?.interestRateMargin?.toString() || ''}
                  readOnly
                  className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                  </div>
                  Leverage Covenant
                </label>
                <Input
                  value={currentData?.leverageCovenant?.toString() || ''}
                  readOnly
                  className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg mr-2">
                    <Leaf className="w-4 h-4 text-slate-600" />
                  </div>
                  ESG Target
                </label>
                <Textarea
                  value={currentData?.esgTarget || ''}
                  readOnly
                  className="min-h-[80px] resize-none bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200"
                />
              </div>
            </div>

            {/* Processing Stats */}
            {processingStats.processingTime && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Processing time: {processingStats.processingTime}ms</div>
                  {processingStats.extractedFields && (
                    <div className="mt-1">Fields extracted: {processingStats.extractedFields.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Verify and Lock Button */}
            {isDataReady && !state.verificationStatus.isVerified && (
              <div className="pt-4 border-t border-slate-200">
                <Button
                  onClick={handleVerifyAndLock}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verify & Lock Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}