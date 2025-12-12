import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ApplicationProvider, useApplication, useLoanData } from './ApplicationContext';
import { LoanData } from '@/types';
import * as fc from 'fast-check';

// Test component to interact with the context
function TestComponent() {
  const { state, setLoanData, verifyAndLockData, applyESGDiscount, updateCurrentLeverage, toggleDemoMode } = useApplication();
  const loanData = useLoanData();

  const handleSetLoanData = () => {
    const testLoanData: LoanData = {
      borrowerName: 'Test Corp',
      facilityAmount: 100000000,
      currency: 'USD',
      interestRateMargin: 2.5,
      leverageCovenant: 4.0,
      esgTarget: 'Carbon neutral by 2030',
    };
    setLoanData(testLoanData);
  };

  const handleVerifyData = () => {
    verifyAndLockData();
  };

  const handleApplyESGDiscount = () => {
    applyESGDiscount();
  };

  const handleUpdateLeverage = () => {
    updateCurrentLeverage(5.0);
  };

  const handleToggleDemo = () => {
    toggleDemoMode();
  };

  return (
    <div>
      <div data-testid="loan-data">{loanData ? loanData.borrowerName : 'No loan data'}</div>
      <div data-testid="verification-status">{state.verificationStatus.isVerified ? 'Verified' : 'Not verified'}</div>
      <div data-testid="esg-status">{state.esgStatus.discountApplied ? 'Discount applied' : 'No discount'}</div>
      <div data-testid="risk-status">{state.riskStatus.isInDefault ? 'In default' : 'Safe'}</div>
      <div data-testid="interest-rate">{loanData ? loanData.interestRateMargin : 'N/A'}</div>
      <div data-testid="demo-mode">{state.demoMode ? 'Demo' : 'Live'}</div>
      <button onClick={handleSetLoanData}>Set Loan Data</button>
      <button onClick={handleVerifyData}>Verify Data</button>
      <button onClick={handleApplyESGDiscount}>Apply ESG Discount</button>
      <button onClick={handleUpdateLeverage}>Update Leverage</button>
      <button onClick={handleToggleDemo}>Toggle Demo</button>
    </div>
  );
}

describe('ApplicationContext', () => {
  it('should provide initial state', () => {
    render(
      <ApplicationProvider>
        <TestComponent />
      </ApplicationProvider>
    );

    expect(screen.getByTestId('loan-data')).toHaveTextContent('No loan data');
    expect(screen.getByTestId('verification-status')).toHaveTextContent('Not verified');
    expect(screen.getByTestId('esg-status')).toHaveTextContent('No discount');
    expect(screen.getByTestId('risk-status')).toHaveTextContent('Safe');
  });

  it('should update loan data when setLoanData is called', () => {
    render(
      <ApplicationProvider>
        <TestComponent />
      </ApplicationProvider>
    );

    act(() => {
      screen.getByText('Set Loan Data').click();
    });

    expect(screen.getByTestId('loan-data')).toHaveTextContent('Test Corp');
    expect(screen.getByTestId('interest-rate')).toHaveTextContent('2.5');
  });

  it('should update verification status when verifyAndLockData is called', () => {
    render(
      <ApplicationProvider>
        <TestComponent />
      </ApplicationProvider>
    );

    act(() => {
      screen.getByText('Set Loan Data').click();
    });

    act(() => {
      screen.getByText('Verify Data').click();
    });

    expect(screen.getByTestId('verification-status')).toHaveTextContent('Verified');
  });

  it('should apply ESG discount and update interest rate', () => {
    render(
      <ApplicationProvider>
        <TestComponent />
      </ApplicationProvider>
    );

    act(() => {
      screen.getByText('Set Loan Data').click();
    });

    act(() => {
      screen.getByText('Apply ESG Discount').click();
    });

    expect(screen.getByTestId('esg-status')).toHaveTextContent('Discount applied');
    expect(screen.getByTestId('interest-rate')).toHaveTextContent('2.4'); // 2.5 - 0.1
  });

  it('should update risk status when leverage exceeds covenant', () => {
    render(
      <ApplicationProvider>
        <TestComponent />
      </ApplicationProvider>
    );

    act(() => {
      screen.getByText('Set Loan Data').click();
    });

    act(() => {
      screen.getByText('Update Leverage').click();
    });

    expect(screen.getByTestId('risk-status')).toHaveTextContent('In default'); // 5.0 > 4.0 covenant
  });

  it('should throw error when useApplication is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApplication must be used within an ApplicationProvider');

    console.error = originalError;
  });

  /**
   * **Feature: lma-bridge, Property 8: Demo mode functional equivalence**
   * **Validates: Requirements 5.5**
   */
  it('should maintain functional equivalence between demo mode and normal mode operations', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // demo mode flag
        (isDemoMode: boolean) => {
          const { container, unmount } = render(
            <ApplicationProvider>
              <TestComponent />
            </ApplicationProvider>
          );

          try {
            // Set demo mode if needed
            if (isDemoMode) {
              act(() => {
                container.querySelector('button:nth-of-type(5)')?.click(); // Toggle Demo button
              });
            }

            // Set loan data
            act(() => {
              container.querySelector('button:nth-of-type(1)')?.click(); // Set Loan Data button
            });

            // Verify data
            act(() => {
              container.querySelector('button:nth-of-type(2)')?.click(); // Verify Data button
            });

            // Apply ESG discount
            act(() => {
              container.querySelector('button:nth-of-type(3)')?.click(); // Apply ESG Discount button
            });

            // Property: All operations should work the same regardless of demo mode
            const verificationStatus = container.querySelector('[data-testid="verification-status"]')?.textContent;
            const esgStatus = container.querySelector('[data-testid="esg-status"]')?.textContent;
            const loanData = container.querySelector('[data-testid="loan-data"]')?.textContent;
            const demoMode = container.querySelector('[data-testid="demo-mode"]')?.textContent;

            expect(verificationStatus).toBe('Verified');
            expect(esgStatus).toBe('Discount applied');
            expect(loanData).toBe('Test Corp');
            expect(demoMode).toBe(isDemoMode ? 'Demo' : 'Live');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Demo Mode functionality', () => {
    it('should toggle demo mode state when toggleDemoMode is called', () => {
      render(
        <ApplicationProvider>
          <TestComponent />
        </ApplicationProvider>
      );

      // Initially should be in live mode
      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Live');

      // Toggle to demo mode
      act(() => {
        screen.getByText('Toggle Demo').click();
      });

      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Demo');

      // Toggle back to live mode
      act(() => {
        screen.getByText('Toggle Demo').click();
      });

      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Live');
    });

    it('should reset state when exiting demo mode', () => {
      render(
        <ApplicationProvider>
          <TestComponent />
        </ApplicationProvider>
      );

      // Set some loan data first
      act(() => {
        screen.getByText('Set Loan Data').click();
      });

      act(() => {
        screen.getByText('Verify Data').click();
      });

      // Verify data is set
      expect(screen.getByTestId('loan-data')).toHaveTextContent('Test Corp');
      expect(screen.getByTestId('verification-status')).toHaveTextContent('Verified');

      // Toggle to demo mode
      act(() => {
        screen.getByText('Toggle Demo').click();
      });

      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Demo');

      // Toggle back to live mode - should reset state
      act(() => {
        screen.getByText('Toggle Demo').click();
      });

      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Live');
      expect(screen.getByTestId('loan-data')).toHaveTextContent('No loan data');
      expect(screen.getByTestId('verification-status')).toHaveTextContent('Not verified');
    });

    it('should maintain demo mode state when performing operations', () => {
      render(
        <ApplicationProvider>
          <TestComponent />
        </ApplicationProvider>
      );

      // Toggle to demo mode
      act(() => {
        screen.getByText('Toggle Demo').click();
      });

      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Demo');

      // Perform operations - demo mode should remain active
      act(() => {
        screen.getByText('Set Loan Data').click();
      });

      act(() => {
        screen.getByText('Verify Data').click();
      });

      act(() => {
        screen.getByText('Apply ESG Discount').click();
      });

      // Demo mode should still be active
      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Demo');
      
      // Operations should still work
      expect(screen.getByTestId('verification-status')).toHaveTextContent('Verified');
      expect(screen.getByTestId('esg-status')).toHaveTextContent('Discount applied');
    });
  });
});