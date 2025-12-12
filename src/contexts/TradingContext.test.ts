import * as fc from 'fast-check';
import { ApplicationProvider, useApplication } from './ApplicationContext';
import { LenderAllocation, TradingStatus } from '@/types';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

/**
 * **Feature: lma-bridge, Property 9: Trading allocation consistency**
 * **Validates: Requirements 8.2, 8.3, 8.4, 8.5**
 */

// Helper function to create a wrapper for the context
const createWrapper = () => ({ children }: { children: React.ReactNode }) =>
  React.createElement(ApplicationProvider, {}, children);

// Generator for valid lender allocations
const lenderAllocationArb = fc.record({
  lenderName: fc.string({ minLength: 1, maxLength: 50 }).filter(name => name.trim().length > 0),
  amount: fc.integer({ min: 1000000, max: 500000000 }), // $1M to $500M
  percentage: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true })
});

// Generator for valid trading scenarios
const tradingScenarioArb = fc.record({
  initialAllocations: fc.array(lenderAllocationArb, { minLength: 2, maxLength: 10 }),
  sellAmount: fc.integer({ min: 1000000, max: 100000000 }), // $1M to $100M
  buyerName: fc.string({ minLength: 1, maxLength: 50 }).filter(name => name.trim().length > 0)
});

describe('Trading Allocation Consistency Properties', () => {
  it('should maintain total facility amount constant across trades', () => {
    fc.assert(
      fc.property(tradingScenarioArb, (scenario) => {
        const { result } = renderHook(() => useApplication(), {
          wrapper: createWrapper()
        });

        // Calculate total facility amount from initial allocations
        const totalFacilityAmount = scenario.initialAllocations.reduce(
          (sum, allocation) => sum + allocation.amount, 
          0
        );

        // Set up initial trading state
        act(() => {
          result.current.dispatch({
            type: 'SET_TRADING_STATUS',
            payload: {
              lenderAllocations: scenario.initialAllocations,
              totalFacilityAmount,
              lastTradeTimestamp: null,
              settlementStatus: 'instant'
            }
          });
        });

        // Find a seller with sufficient amount
        const sellerWithSufficientAmount = scenario.initialAllocations.find(
          allocation => allocation.amount >= scenario.sellAmount
        );

        // Only proceed if there's a valid seller
        if (sellerWithSufficientAmount) {
          // Execute trade
          act(() => {
            result.current.executeTrade(scenario.sellAmount, scenario.buyerName);
          });

          const finalState = result.current.state.tradingStatus;
          
          // Property: Total facility amount should remain constant
          const finalTotalAmount = finalState.lenderAllocations.reduce(
            (sum, allocation) => sum + allocation.amount,
            0
          );
          
          expect(finalTotalAmount).toBe(totalFacilityAmount);
          expect(finalState.totalFacilityAmount).toBe(totalFacilityAmount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure all lender percentages sum to 100%', () => {
    fc.assert(
      fc.property(tradingScenarioArb, (scenario) => {
        const { result } = renderHook(() => useApplication(), {
          wrapper: createWrapper()
        });

        // Calculate total facility amount from initial allocations
        const totalFacilityAmount = scenario.initialAllocations.reduce(
          (sum, allocation) => sum + allocation.amount, 
          0
        );

        // Set up initial trading state
        act(() => {
          result.current.dispatch({
            type: 'SET_TRADING_STATUS',
            payload: {
              lenderAllocations: scenario.initialAllocations,
              totalFacilityAmount,
              lastTradeTimestamp: null,
              settlementStatus: 'instant'
            }
          });
        });

        // Find a seller with sufficient amount
        const sellerWithSufficientAmount = scenario.initialAllocations.find(
          allocation => allocation.amount >= scenario.sellAmount
        );

        // Only proceed if there's a valid seller
        if (sellerWithSufficientAmount) {
          // Execute trade
          act(() => {
            result.current.executeTrade(scenario.sellAmount, scenario.buyerName);
          });

          const finalState = result.current.state.tradingStatus;
          
          // Property: All percentages should sum to 100% (within floating point tolerance)
          const totalPercentage = finalState.lenderAllocations.reduce(
            (sum, allocation) => sum + allocation.percentage,
            0
          );
          
          expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.01); // Allow for floating point precision
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should mark settlement as instant for all trades', () => {
    fc.assert(
      fc.property(tradingScenarioArb, (scenario) => {
        const { result } = renderHook(() => useApplication(), {
          wrapper: createWrapper()
        });

        // Calculate total facility amount from initial allocations
        const totalFacilityAmount = scenario.initialAllocations.reduce(
          (sum, allocation) => sum + allocation.amount, 
          0
        );

        // Set up initial trading state
        act(() => {
          result.current.dispatch({
            type: 'SET_TRADING_STATUS',
            payload: {
              lenderAllocations: scenario.initialAllocations,
              totalFacilityAmount,
              lastTradeTimestamp: null,
              settlementStatus: 'instant'
            }
          });
        });

        // Find a seller with sufficient amount
        const sellerWithSufficientAmount = scenario.initialAllocations.find(
          allocation => allocation.amount >= scenario.sellAmount
        );

        // Only proceed if there's a valid seller
        if (sellerWithSufficientAmount) {
          // Execute trade
          act(() => {
            result.current.executeTrade(scenario.sellAmount, scenario.buyerName);
          });

          const finalState = result.current.state.tradingStatus;
          
          // Property: Settlement should always be instant
          expect(finalState.settlementStatus).toBe('instant');
          expect(finalState.lastTradeTimestamp).toBeInstanceOf(Date);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly update lender allocations after trade execution', () => {
    fc.assert(
      fc.property(tradingScenarioArb, (scenario) => {
        const { result } = renderHook(() => useApplication(), {
          wrapper: createWrapper()
        });

        // Calculate total facility amount from initial allocations
        const totalFacilityAmount = scenario.initialAllocations.reduce(
          (sum, allocation) => sum + allocation.amount, 
          0
        );

        // Set up initial trading state
        act(() => {
          result.current.dispatch({
            type: 'SET_TRADING_STATUS',
            payload: {
              lenderAllocations: scenario.initialAllocations,
              totalFacilityAmount,
              lastTradeTimestamp: null,
              settlementStatus: 'instant'
            }
          });
        });

        // Find a seller with sufficient amount
        const sellerWithSufficientAmount = scenario.initialAllocations.find(
          allocation => allocation.amount >= scenario.sellAmount
        );

        // Only proceed if there's a valid seller
        if (sellerWithSufficientAmount) {
          const initialBuyerAmount = scenario.initialAllocations.find(
            allocation => allocation.lenderName === scenario.buyerName
          )?.amount || 0;

          // Execute trade
          act(() => {
            result.current.executeTrade(scenario.sellAmount, scenario.buyerName);
          });

          const finalState = result.current.state.tradingStatus;
          
          // Property: Buyer should have increased amount, seller should have decreased amount
          const finalBuyer = finalState.lenderAllocations.find(
            allocation => allocation.lenderName === scenario.buyerName
          );
          
          expect(finalBuyer).toBeDefined();
          expect(finalBuyer!.amount).toBe(initialBuyerAmount + scenario.sellAmount);
          
          // Property: Each allocation's percentage should match its amount/total ratio
          finalState.lenderAllocations.forEach(allocation => {
            const expectedPercentage = (allocation.amount / totalFacilityAmount) * 100;
            expect(Math.abs(allocation.percentage - expectedPercentage)).toBeLessThan(0.01);
          });
        }
      }),
      { numRuns: 100 }
    );
  });
});