import * as fc from 'fast-check';
import { ApplicationProvider, useApplication } from '@/contexts/ApplicationContext';
import { LoanData } from '@/types';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider>{children}</ApplicationProvider>
);

describe('ESG Manager Property Tests', () => {
  /**
   * **Feature: lma-bridge, Property 4: ESG discount calculation accuracy**
   * **Validates: Requirements 3.2, 3.4**
   */
  test('Property 4: ESG discount calculation accuracy', () => {
    fc.assert(
      fc.property(
        // Generate valid interest rate margins between 0.1% and 20%
        fc.float({ min: Math.fround(0.1), max: Math.fround(20.0), noNaN: true }),
        fc.record({
          borrowerName: fc.string({ minLength: 1, maxLength: 200 }),
          facilityAmount: fc.integer({ min: 1000000, max: 1000000000 }),
          currency: fc.constantFrom('USD', 'EUR', 'GBP', 'JPY', 'CHF'),
          leverageCovenant: fc.float({ min: Math.fround(0.1), max: Math.fround(50.0), noNaN: true }),
          esgTarget: fc.string({ minLength: 5, maxLength: 500 })
        }),
        (initialMargin, loanDataPartial) => {
          const loanData: LoanData = {
            ...loanDataPartial,
            interestRateMargin: initialMargin
          };

          const { result } = renderHook(() => useApplication(), { wrapper });

          // Set initial loan data
          act(() => {
            result.current.setLoanData(loanData);
          });

          // Get initial state
          const initialState = result.current.state;
          const initialESGStatus = initialState.esgStatus;
          const initialLoanData = initialState.currentLoan;

          // Apply ESG discount
          act(() => {
            result.current.applyESGDiscount();
          });

          // Get updated state
          const updatedState = result.current.state;
          const updatedESGStatus = updatedState.esgStatus;
          const updatedLoanData = updatedState.currentLoan;

          // Verify discount calculation accuracy
          if (initialLoanData && updatedLoanData) {
            const expectedNewMargin = Math.max(0, initialMargin - 0.1);
            const actualNewMargin = updatedLoanData.interestRateMargin;
            
            // The margin should be reduced by exactly 0.1 percentage points (or to 0 if it would go negative)
            expect(actualNewMargin).toBeCloseTo(expectedNewMargin, 10);
          }

          // Verify ESG status updates
          expect(updatedESGStatus.discountApplied).toBe(true);
          expect(updatedESGStatus.verificationUploaded).toBe(true);
          
          // Verify ESG target is preserved
          expect(updatedESGStatus.target).toBe(loanData.esgTarget);
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Unit Tests', () => {
    test('displays ESG target from global state', () => {
      const testLoanData: LoanData = {
        borrowerName: 'Test Corp',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: 'Reduce carbon emissions by 30% by 2030'
      };

      const { result } = renderHook(() => useApplication(), { wrapper });

      act(() => {
        result.current.setLoanData(testLoanData);
      });

      const esgStatus = result.current.state.esgStatus;
      expect(esgStatus.target).toBe(testLoanData.esgTarget);
    });

    test('applies sustainability discount correctly', () => {
      const testLoanData: LoanData = {
        borrowerName: 'Test Corp',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: 'Reduce carbon emissions by 30% by 2030'
      };

      const { result } = renderHook(() => useApplication(), { wrapper });

      act(() => {
        result.current.setLoanData(testLoanData);
      });

      const initialMargin = result.current.state.currentLoan?.interestRateMargin;

      act(() => {
        result.current.applyESGDiscount();
      });

      const updatedState = result.current.state;
      const updatedMargin = updatedState.currentLoan?.interestRateMargin;
      const esgStatus = updatedState.esgStatus;

      expect(updatedMargin).toBe(2.4); // 2.5 - 0.1
      expect(esgStatus.discountApplied).toBe(true);
      expect(esgStatus.verificationUploaded).toBe(true);
    });

    test('handles edge case where margin would go negative', () => {
      const testLoanData: LoanData = {
        borrowerName: 'Test Corp',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 0.05, // Very low margin
        leverageCovenant: 4.0,
        esgTarget: 'Reduce carbon emissions by 30% by 2030'
      };

      const { result } = renderHook(() => useApplication(), { wrapper });

      act(() => {
        result.current.setLoanData(testLoanData);
      });

      act(() => {
        result.current.applyESGDiscount();
      });

      const updatedState = result.current.state;
      const updatedMargin = updatedState.currentLoan?.interestRateMargin;

      expect(updatedMargin).toBe(0); // Should not go negative
    });

    test('success banner display logic works correctly', () => {
      const testLoanData: LoanData = {
        borrowerName: 'Test Corp',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: 'Reduce carbon emissions by 30% by 2030'
      };

      const { result } = renderHook(() => useApplication(), { wrapper });

      // Initially no discount applied
      expect(result.current.state.esgStatus.discountApplied).toBe(false);

      act(() => {
        result.current.setLoanData(testLoanData);
      });

      act(() => {
        result.current.applyESGDiscount();
      });

      // After applying discount
      const esgStatus = result.current.state.esgStatus;
      expect(esgStatus.discountApplied).toBe(true);
      expect(esgStatus.verificationUploaded).toBe(true);
    });
  });
});