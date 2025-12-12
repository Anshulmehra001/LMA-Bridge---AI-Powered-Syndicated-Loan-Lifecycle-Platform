'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorNotification } from '@/components/ui/error-notification';
import { useApplication, useESGStatus, useLoanData } from '@/contexts/ApplicationContext';
import { CheckCircle, Upload, AlertTriangle } from 'lucide-react';
import { getUserFriendlyError } from '@/types';

export function ESGManagerTab() {
  const { applyESGDiscount } = useApplication();
  const esgStatus = useESGStatus();
  const loanData = useLoanData();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadVerification = () => {
    try {
      // Validate that loan data exists
      if (!loanData) {
        setError('No loan data available. Please complete the origination process first.');
        return;
      }

      // Validate that ESG target exists
      if (!loanData.esgTarget || loanData.esgTarget.trim().length === 0) {
        setError('No ESG target found in loan data. Cannot apply sustainability discount.');
        return;
      }

      // Validate interest rate margin
      if (loanData.interestRateMargin <= 0.1) {
        setError('Interest rate margin is too low to apply discount. Minimum margin after discount must be 0.01%.');
        return;
      }

      // Clear any previous errors
      setError(null);
      
      // Apply the discount
      applyESGDiscount();
      setShowSuccessBanner(true);
      
      // Hide success banner after 5 seconds
      setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
    } catch (error) {
      console.error('Error applying ESG discount:', error);
      setError('Failed to apply ESG discount. Please try again.');
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Error Notification */}
      {error && (
        <ErrorNotification
          error={getUserFriendlyError(error)}
          onDismiss={handleDismissError}
        />
      )}

      {/* No Loan Data Warning */}
      {!loanData && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                No Loan Data Available
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Please complete the loan origination process first to access ESG management features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {showSuccessBanner && esgStatus.discountApplied && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 animate-fade-in success-glow">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 animate-pulse-success" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Sustainability Discount Applied
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Interest rate margin reduced by 0.1% for meeting ESG targets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ESG Target Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-slate-900 flex items-center justify-between">
            ESG Target
            {esgStatus.verificationUploaded && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse-success">
                Verified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-slate-700">
                {esgStatus.target || loanData?.esgTarget || 'No ESG target available'}
              </p>
            </div>

            {loanData && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Current Interest Rate Margin:</span>
                  <p className="text-lg font-semibold text-slate-900">
                    {loanData.interestRateMargin}%
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Facility Amount:</span>
                  <p className="text-lg font-semibold text-slate-900">
                    {loanData.currency} {loanData.facilityAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-slate-900">
            ESG Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-600">
              Upload verification documents to confirm ESG target achievement and receive a 0.1% interest rate discount.
            </p>
            
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-md">
              <div>
                <h4 className="font-medium text-slate-900">Sustainability Discount</h4>
                <p className="text-sm text-slate-600">
                  Reduce interest rate margin by 0.1 percentage points
                </p>
              </div>
              <Button
                onClick={handleUploadVerification}
                disabled={esgStatus.verificationUploaded || !loanData}
                className="rounded-md transition-all duration-200 hover:scale-105"
                variant={esgStatus.verificationUploaded ? "secondary" : "default"}
              >
                {esgStatus.verificationUploaded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Verification
                  </>
                )}
              </Button>
            </div>

            {esgStatus.discountApplied && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md animate-fade-in">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 animate-pulse-success" />
                  <div>
                    <h4 className="font-medium text-green-800">Discount Applied</h4>
                    <p className="text-sm text-green-700">
                      Interest rate margin has been reduced to {loanData?.interestRateMargin}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}