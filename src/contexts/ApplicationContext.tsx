'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  ApplicationState, 
  LoanData, 
  VerificationState, 
  ESGStatus, 
  RiskStatus, 
  TradingStatus,
  LenderAllocation 
} from '@/types';

// Action types for state management
type ApplicationAction =
  | { type: 'SET_LOAN_DATA'; payload: LoanData }
  | { type: 'SET_VERIFICATION_STATUS'; payload: VerificationState }
  | { type: 'SET_ESG_STATUS'; payload: ESGStatus }
  | { type: 'SET_RISK_STATUS'; payload: RiskStatus }
  | { type: 'SET_TRADING_STATUS'; payload: TradingStatus }
  | { type: 'UPDATE_INTEREST_RATE_MARGIN'; payload: number }
  | { type: 'UPDATE_CURRENT_LEVERAGE'; payload: number }
  | { type: 'EXECUTE_TRADE'; payload: { sellAmount: number; buyerName: string } }
  | { type: 'TOGGLE_DEMO_MODE' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: ApplicationState = {
  currentLoan: null,
  verificationStatus: {
    isVerified: false,
    isLocked: false,
    verificationTimestamp: null,
  },
  esgStatus: {
    target: '',
    discountApplied: false,
    verificationUploaded: false,
  },
  riskStatus: {
    currentLeverage: 0,
    isInDefault: false,
    warningLevel: 'safe',
  },
  tradingStatus: {
    lenderAllocations: [
      { lenderName: 'Bank A', amount: 50000000, percentage: 50 },
      { lenderName: 'Bank B', amount: 30000000, percentage: 30 },
      { lenderName: 'Bank C', amount: 20000000, percentage: 20 },
    ],
    totalFacilityAmount: 100000000,
    lastTradeTimestamp: null,
    settlementStatus: 'instant',
  },
  demoMode: false,
};

// Reducer function
function applicationReducer(state: ApplicationState, action: ApplicationAction): ApplicationState {
  switch (action.type) {
    case 'SET_LOAN_DATA':
      return {
        ...state,
        currentLoan: action.payload,
        esgStatus: {
          ...state.esgStatus,
          target: action.payload.esgTarget,
        },
        tradingStatus: {
          ...state.tradingStatus,
          totalFacilityAmount: action.payload.facilityAmount,
        },
      };

    case 'SET_VERIFICATION_STATUS':
      return {
        ...state,
        verificationStatus: action.payload,
      };

    case 'SET_ESG_STATUS':
      return {
        ...state,
        esgStatus: action.payload,
      };

    case 'SET_RISK_STATUS':
      return {
        ...state,
        riskStatus: action.payload,
      };

    case 'SET_TRADING_STATUS':
      return {
        ...state,
        tradingStatus: action.payload,
      };

    case 'UPDATE_INTEREST_RATE_MARGIN':
      if (!state.currentLoan) return state;
      return {
        ...state,
        currentLoan: {
          ...state.currentLoan,
          interestRateMargin: action.payload,
        },
      };

    case 'UPDATE_CURRENT_LEVERAGE':
      const newLeverage = action.payload;
      const leverageCovenant = state.currentLoan?.leverageCovenant || 0;
      const isInDefault = newLeverage > leverageCovenant;
      
      return {
        ...state,
        riskStatus: {
          ...state.riskStatus,
          currentLeverage: newLeverage,
          isInDefault,
          warningLevel: isInDefault ? 'breach' : newLeverage > leverageCovenant * 0.9 ? 'warning' : 'safe',
        },
      };

    case 'EXECUTE_TRADE':
      const { sellAmount, buyerName } = action.payload;
      const currentAllocations = [...state.tradingStatus.lenderAllocations];
      
      // Find seller (first lender with sufficient amount)
      const sellerIndex = currentAllocations.findIndex(lender => lender.amount >= sellAmount);
      if (sellerIndex === -1) return state; // No seller with sufficient amount
      
      // Find or create buyer
      let buyerIndex = currentAllocations.findIndex(lender => lender.lenderName === buyerName);
      if (buyerIndex === -1) {
        // Add new buyer
        currentAllocations.push({
          lenderName: buyerName,
          amount: sellAmount,
          percentage: 0, // Will be calculated below
        });
        buyerIndex = currentAllocations.length - 1;
      } else {
        // Update existing buyer
        currentAllocations[buyerIndex].amount += sellAmount;
      }
      
      // Update seller
      currentAllocations[sellerIndex].amount -= sellAmount;
      
      // Remove seller if they have no remaining amount
      if (currentAllocations[sellerIndex].amount === 0) {
        currentAllocations.splice(sellerIndex, 1);
        if (buyerIndex > sellerIndex) buyerIndex--; // Adjust buyer index if needed
      }
      
      // Recalculate percentages
      const totalAmount = state.tradingStatus.totalFacilityAmount;
      currentAllocations.forEach(lender => {
        lender.percentage = (lender.amount / totalAmount) * 100;
      });
      
      return {
        ...state,
        tradingStatus: {
          ...state.tradingStatus,
          lenderAllocations: currentAllocations,
          lastTradeTimestamp: new Date(),
          settlementStatus: 'instant',
        },
      };

    case 'TOGGLE_DEMO_MODE':
      const newDemoMode = !state.demoMode;
      if (!newDemoMode) {
        // When exiting demo mode, reset to initial state
        return {
          ...initialState,
          demoMode: false,
        };
      } else {
        // When entering demo mode, just toggle the flag
        return {
          ...state,
          demoMode: true,
        };
      }

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context type
interface ApplicationContextType {
  state: ApplicationState;
  dispatch: React.Dispatch<ApplicationAction>;
  // Helper functions
  setLoanData: (data: LoanData) => void;
  verifyAndLockData: () => void;
  applyESGDiscount: () => void;
  updateCurrentLeverage: (leverage: number) => void;
  executeTrade: (sellAmount: number, buyerName: string) => void;
  toggleDemoMode: () => void;
  resetState: () => void;
}

// Create context
const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

// Provider component
interface ApplicationProviderProps {
  children: ReactNode;
}

export function ApplicationProvider({ children }: ApplicationProviderProps) {
  const [state, dispatch] = useReducer(applicationReducer, initialState);

  // Helper functions
  const setLoanData = (data: LoanData) => {
    dispatch({ type: 'SET_LOAN_DATA', payload: data });
  };

  const verifyAndLockData = () => {
    dispatch({
      type: 'SET_VERIFICATION_STATUS',
      payload: {
        isVerified: true,
        isLocked: true,
        verificationTimestamp: new Date(),
      },
    });
  };

  const applyESGDiscount = () => {
    if (state.currentLoan) {
      const newMargin = Math.max(0, state.currentLoan.interestRateMargin - 0.1);
      dispatch({ type: 'UPDATE_INTEREST_RATE_MARGIN', payload: newMargin });
      dispatch({
        type: 'SET_ESG_STATUS',
        payload: {
          ...state.esgStatus,
          discountApplied: true,
          verificationUploaded: true,
        },
      });
    }
  };

  const updateCurrentLeverage = (leverage: number) => {
    dispatch({ type: 'UPDATE_CURRENT_LEVERAGE', payload: leverage });
  };

  const executeTrade = (sellAmount: number, buyerName: string) => {
    dispatch({ type: 'EXECUTE_TRADE', payload: { sellAmount, buyerName } });
  };

  const toggleDemoMode = () => {
    dispatch({ type: 'TOGGLE_DEMO_MODE' });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const contextValue: ApplicationContextType = {
    state,
    dispatch,
    setLoanData,
    verifyAndLockData,
    applyESGDiscount,
    updateCurrentLeverage,
    executeTrade,
    toggleDemoMode,
    resetState,
  };

  return (
    <ApplicationContext.Provider value={contextValue}>
      {children}
    </ApplicationContext.Provider>
  );
}

// Custom hook for using the context
export function useApplication() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
}

// Additional custom hooks for specific data access
export function useLoanData() {
  const { state } = useApplication();
  return state.currentLoan;
}

export function useVerificationStatus() {
  const { state } = useApplication();
  return state.verificationStatus;
}

export function useESGStatus() {
  const { state } = useApplication();
  return state.esgStatus;
}

export function useRiskStatus() {
  const { state } = useApplication();
  return state.riskStatus;
}

export function useTradingStatus() {
  const { state } = useApplication();
  return state.tradingStatus;
}

export function useDemoMode() {
  const { state } = useApplication();
  return state.demoMode;
}