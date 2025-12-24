'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ErrorNotification } from '@/components/ui/error-notification';
import { RealTimeClock } from '@/components/ui/dynamic-clock';
import { useApplication, useESGStatus, useLoanData } from '@/contexts/ApplicationContext';
import { CheckCircle, Upload, AlertTriangle, FileText, Loader2, Leaf, Target, TrendingDown, Award, Calendar, DollarSign } from 'lucide-react';
import { getUserFriendlyError, LoanData } from '@/types';
import { analyzeLoan } from '@/actions/analyzeLoan';

// Sample ESG-focused loan document
const SAMPLE_ESG_DOCUMENT = `SUSTAINABILITY-LINKED LOAN AGREEMENT

This Sustainability-Linked Loan Agreement is entered into between GREEN ENERGY SOLUTIONS INC., a Delaware corporation (the "Borrower"), and the participating lenders.

FACILITY DETAILS:
- Principal Amount: $400,000,000 USD
- Interest Rate: SOFR + 2.25% per annum
- Maturity: 7 years
- Purpose: Renewable energy projects and carbon reduction initiatives

SUSTAINABILITY PERFORMANCE TARGETS:
1. Reduce Scope 1 and 2 carbon emissions by 50% by December 2027 (baseline: 2023)
2. Achieve 75% renewable energy in operations by December 2026
3. Maintain ESG rating of A- or higher from recognized rating agencies
4. Implement zero-waste-to-landfill policy across all facilities by 2025

PRICING ADJUSTMENTS:
- Interest rate discount of 0.50% per annum upon achievement of all sustainability targets
- Quarterly reporting required on ESG performance metrics
- Third-party verification required for target achievement

FINANCIAL COVENANTS:
- Maximum Total Leverage Ratio: 3.75:1.00
- Minimum Interest Coverage Ratio: 4.00:1.00

The Borrower commits to transparent reporting and independent verification of all sustainability metrics.`;

export function ESGManagerTab() {
  const { applyESGDiscount, setLoanData } = useApplication();
  const esgStatus = useESGStatus();
  const loanData = useLoanData();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showUploadSection, setShowUploadSection] = useState(!loanData);
  const [esgMetrics, setESGMetrics] = useState({
    carbonReduction: 0,
    renewableEnergy: 0,
    esgRating: 'B+',
    lastUpdated: new Date()
  });
  const [milestones, setMilestones] = useState([
    { id: 1, title: 'Reduce carbon emissions by 30%', target: '2027', completed: false, impact: 'High' },
    { id: 2, title: 'Achieve 50% renewable energy', target: '2026', completed: false, impact: 'High' },
    { id: 3, title: 'Maintain ESG rating B+ or higher', target: 'Ongoing', completed: true, impact: 'Medium' },
    { id: 4, title: 'Implement zero-waste policy', target: '2025', completed: false, impact: 'Medium' }
  ]);

  const handleUploadVerification = () => {
    try {
      if (!loanData) {
        setError('No loan data available. Please upload an ESG document first or complete the origination process.');
        return;
      }

      if (!loanData.esgTarget || loanData.esgTarget.trim().length === 0) {
        setError('No ESG target found in loan data. Cannot apply sustainability discount.');
        return;
      }

      if (loanData.interestRateMargin <= 0.1) {
        setError('Interest rate margin is too low to apply discount. Minimum margin after discount must be 0.01%.');
        return;
      }

      setError(null);
      applyESGDiscount();
      setShowSuccessBanner(true);
      
      setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
    } catch (error) {
      console.error('Error applying ESG discount:', error);
      setError('Failed to apply ESG discount. Please try again.');
    }
  };

  const handleAnalyzeESGDocument = () => {
    if (!documentText.trim()) {
      setError('Please enter ESG document text before analyzing.');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await analyzeLoan(documentText);
        
        if (result && result.success && result.data) {
          setLoanData(result.data);
          setShowUploadSection(false);
          setError(null);
        } else {
          const errorCode = result?.error || 'UNKNOWN_ERROR';
          const friendlyError = getUserFriendlyError(new Error(errorCode));
          setError(`${friendlyError.title}: ${friendlyError.message}`);
        }
      } catch (error) {
        console.error('Error analyzing ESG document:', error);
        const friendlyError = getUserFriendlyError(error as Error);
        setError(`${friendlyError.title}: ${friendlyError.message}`);
      }
    });
  };

  const handleUseSampleDocument = () => {
    setDocumentText(SAMPLE_ESG_DOCUMENT);
  };

  const handleDismissError = () => {
    setError(null);
  };

  const handleShowUploadSection = () => {
    setShowUploadSection(true);
  };

  const handleToggleMilestone = (id: number) => {
    setMilestones(prev => prev.map(milestone => 
      milestone.id === id ? { ...milestone, completed: !milestone.completed } : milestone
    ));
  };

  // Calculate ESG performance metrics
  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const completionRate = (completedMilestones / totalMilestones) * 100;
  const potentialSavings = loanData ? Math.round((loanData.facilityAmount * 0.001)) : 0;
  const actualSavings = esgStatus.discountApplied ? potentialSavings : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-teal-600 bg-clip-text text-transparent">
            ESG & Sustainability Manager
          </h2>
          <p className="text-slate-600 mt-2 text-lg">Track environmental goals and manage sustainability-linked pricing</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-lg">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">ESG Score</p>
            <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(0)}%</p>
          </div>
          <div className="text-right bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl shadow-lg">
            <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Annual Savings</p>
            <p className="text-2xl font-bold text-teal-600">${actualSavings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <ErrorNotification
          error={getUserFriendlyError(error)}
          onDismiss={handleDismissError}
        />
      )}

      {/* Success Banner */}
      {showSuccessBanner && esgStatus.discountApplied && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 animate-fade-in shadow-xl">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-full mr-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-800">
                Sustainability Discount Applied Successfully
              </h3>
              <p className="text-green-700 mt-2 text-lg">
                Interest rate margin reduced by 0.1% for meeting ESG targets. 
                Annual savings: ${potentialSavings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ESG Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Completion Rate</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{completionRate.toFixed(0)}%</p>
              </div>
              <div className="bg-green-500 p-4 rounded-full">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Milestones</p>
                <p className="text-4xl font-bold text-blue-700 mt-2">{completedMilestones}/{totalMilestones}</p>
              </div>
              <div className="bg-blue-500 p-4 rounded-full">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Rate Discount</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {esgStatus.discountApplied ? '0.1%' : '0.0%'}
                </p>
              </div>
              <div className="bg-purple-500 p-4 rounded-full">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Annual Savings</p>
                <p className="text-4xl font-bold text-teal-600 mt-2">${actualSavings.toLocaleString()}</p>
              </div>
              <div className="bg-teal-500 p-4 rounded-full">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ESG Document Upload Section */}
      {showUploadSection && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-6 h-6" />
              <span>ESG Document Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              Upload or paste your sustainability-linked loan agreement to extract ESG targets and pricing terms.
            </p>
            
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleUseSampleDocument}
                variant="outline"
                className="rounded-md"
              >
                <FileText className="w-4 h-4 mr-2" />
                Use Sample ESG Document
              </Button>
            </div>

            <Textarea
              placeholder="Paste your sustainability-linked loan agreement here..."
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="min-h-[300px] resize-none"
            />

            <div className="flex justify-end">
              <Button
                onClick={handleAnalyzeESGDocument}
                disabled={!documentText.trim() || isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing ESG Document...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Analyze ESG Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Loan Data Warning */}
      {!loanData && !showUploadSection && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-amber-800">
                  No ESG Data Available
                </h3>
                <p className="text-amber-700 mt-1">
                  Upload an ESG document or complete the loan origination process to access ESG management features.
                </p>
              </div>
            </div>
            <Button
              onClick={handleShowUploadSection}
              variant="outline"
              className="rounded-md"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload ESG Document
            </Button>
          </div>
        </div>
      )}

      {/* ESG Milestones Tracking */}
      {loanData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="w-6 h-6" />
              <span>Sustainability Milestones</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleToggleMilestone(milestone.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      milestone.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-slate-300 hover:border-green-400'
                    }`}
                  >
                    {milestone.completed && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className={`font-medium ${milestone.completed ? 'text-green-800' : 'text-slate-900'}`}>
                      {milestone.title}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-slate-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Target: {milestone.target}
                      </span>
                      <Badge 
                        variant={milestone.impact === 'High' ? 'destructive' : 'secondary'}
                        className={milestone.impact === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
                      >
                        {milestone.impact} Impact
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {milestone.completed && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ESG Target Display */}
      {loanData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ESG Sustainability Targets</span>
              {esgStatus.verificationUploaded && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 whitespace-pre-line">
                  {esgStatus.target || loanData?.esgTarget || 'No ESG target available'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">Current Interest Rate:</span>
                  <p className="text-2xl font-bold text-blue-900">
                    {loanData.interestRateMargin}%
                  </p>
                  {esgStatus.discountApplied && (
                    <p className="text-xs text-blue-600 mt-1">
                      ↓ 0.1% ESG discount applied
                    </p>
                  )}
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Facility Amount:</span>
                  <p className="text-2xl font-bold text-green-900">
                    {loanData.currency} {loanData.facilityAmount.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-purple-700">Borrower:</span>
                  <p className="text-2xl font-bold text-purple-900">
                    {loanData.borrowerName}
                  </p>
                </div>
              </div>

              {showUploadSection && (
                <Button
                  onClick={() => setShowUploadSection(false)}
                  variant="outline"
                  className="rounded-md"
                >
                  Hide Upload Section
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESG Verification Section */}
      {loanData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-6 h-6" />
              <span>ESG Performance Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-slate-600">
                Verify ESG target achievement to unlock sustainability-linked pricing benefits and interest rate discounts.
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Sustainability Discount Available</h4>
                    <p className="text-slate-600 mt-1">
                      Reduce interest rate margin by 0.1 percentage points upon ESG target verification
                    </p>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-slate-700">
                        <strong>Potential annual savings:</strong> ${potentialSavings.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-700">
                        <strong>Milestone completion:</strong> {completedMilestones}/{totalMilestones} ({completionRate.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUploadVerification}
                    disabled={esgStatus.verificationUploaded}
                    className={`transition-all duration-200 ${
                      esgStatus.verificationUploaded 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-green-600 hover:bg-green-700 hover:scale-105'
                    }`}
                    size="lg"
                  >
                    {esgStatus.verificationUploaded ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Verified & Applied
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Verify ESG Achievement
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {esgStatus.discountApplied && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-4" />
                    <div>
                      <h4 className="text-lg font-semibold text-green-800">Sustainability Discount Applied</h4>
                      <p className="text-green-700 mt-1">
                        Interest rate margin reduced to {loanData?.interestRateMargin}% - 
                        Annual savings: ${actualSavings.toLocaleString()}
                      </p>
                      <div className="text-sm text-green-600 mt-2 flex items-center space-x-2">
                        <span>Discount applied on</span>
                        <RealTimeClock format="date-only" className="font-semibold" />
                        <span>based on verified ESG performance.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}