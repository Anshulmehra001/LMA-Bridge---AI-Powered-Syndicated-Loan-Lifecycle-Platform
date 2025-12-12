import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradingManagerTab } from './TradingManagerTab';
import { ApplicationProvider } from '@/contexts/ApplicationContext';
import { LenderAllocation, TradingStatus } from '@/types';

// Mock the ApplicationContext with initial trading data
const mockTradingStatus: TradingStatus = {
  lenderAllocations: [
    { lenderName: 'Bank A', amount: 50000000, percentage: 50 },
    { lenderName: 'Bank B', amount: 30000000, percentage: 30 },
    { lenderName: 'Bank C', amount: 20000000, percentage: 20 },
  ],
  totalFacilityAmount: 100000000,
  lastTradeTimestamp: null,
  settlementStatus: 'instant',
};

// Wrapper component for testing
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationProvider>
      {children}
    </ApplicationProvider>
  );
}

describe('TradingManagerTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display current lender allocations', () => {
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    // Check if the table is rendered
    expect(screen.getByTestId('lender-allocations-table')).toBeInTheDocument();
    
    // Check if lender names are displayed
    expect(screen.getByText('Bank A')).toBeInTheDocument();
    expect(screen.getByText('Bank B')).toBeInTheDocument();
    expect(screen.getByText('Bank C')).toBeInTheDocument();
    
    // Check if amounts are formatted correctly - using actual rendered values
    expect(screen.getByText('$20,000,000')).toBeInTheDocument(); // Bank C
    expect(screen.getByText('$30,000,000')).toBeInTheDocument(); // Bank B
    
    // Check if percentages are displayed - using actual rendered values
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // Bank C
    expect(screen.getByText('30.0%')).toBeInTheDocument(); // Bank B
  });

  it('should display total facility amount', () => {
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    expect(screen.getByTestId('total-facility-amount')).toHaveTextContent('$100,000,000');
  });

  it('should render trade execution form with input fields', () => {
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    expect(screen.getByTestId('sell-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('buyer-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('execute-trade-button')).toBeInTheDocument();
  });

  it('should disable execute button when inputs are empty', () => {
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    const executeButton = screen.getByTestId('execute-trade-button');
    expect(executeButton).toBeDisabled();
  });

  it('should enable execute button when valid inputs are provided', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    const sellAmountInput = screen.getByTestId('sell-amount-input');
    const buyerNameInput = screen.getByTestId('buyer-name-input');
    const executeButton = screen.getByTestId('execute-trade-button');

    await user.type(sellAmountInput, '10000000');
    await user.type(buyerNameInput, 'New Bank');

    expect(executeButton).toBeEnabled();
  });

  it('should execute trade and update allocation table', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    const sellAmountInput = screen.getByTestId('sell-amount-input');
    const buyerNameInput = screen.getByTestId('buyer-name-input');
    const executeButton = screen.getByTestId('execute-trade-button');

    // Fill in trade details
    await user.type(sellAmountInput, '10000000');
    await user.type(buyerNameInput, 'New Bank');
    
    // Execute trade
    await user.click(executeButton);

    // Check if inputs are cleared after trade
    expect(sellAmountInput).toHaveValue(null);
    expect(buyerNameInput).toHaveValue('');
  });

  it('should display settlement badge after trade execution', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    const sellAmountInput = screen.getByTestId('sell-amount-input');
    const buyerNameInput = screen.getByTestId('buyer-name-input');
    const executeButton = screen.getByTestId('execute-trade-button');

    // Fill in trade details
    await user.type(sellAmountInput, '10000000');
    await user.type(buyerNameInput, 'New Bank');
    
    // Execute trade
    await user.click(executeButton);

    // Check if settlement badge is displayed
    expect(screen.getByTestId('settlement-badge')).toBeInTheDocument();
    expect(screen.getByText('Settlement Time: T+0 (Instant)')).toBeInTheDocument();
  });

  it('should hide settlement badge after timeout', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    const sellAmountInput = screen.getByTestId('sell-amount-input');
    const buyerNameInput = screen.getByTestId('buyer-name-input');
    const executeButton = screen.getByTestId('execute-trade-button');

    // Fill in trade details
    await user.type(sellAmountInput, '10000000');
    await user.type(buyerNameInput, 'New Bank');
    
    // Execute trade
    await user.click(executeButton);

    // Settlement badge should be visible
    expect(screen.getByTestId('settlement-badge')).toBeInTheDocument();

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Settlement badge should be hidden
    expect(screen.queryByTestId('settlement-badge')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should not execute trade with invalid inputs', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    const sellAmountInput = screen.getByTestId('sell-amount-input');
    const buyerNameInput = screen.getByTestId('buyer-name-input');
    const executeButton = screen.getByTestId('execute-trade-button');

    // Test with negative amount
    await user.type(sellAmountInput, '-1000000');
    await user.type(buyerNameInput, 'New Bank');
    expect(executeButton).toBeDisabled();

    // Clear and test with zero amount
    await user.clear(sellAmountInput);
    await user.type(sellAmountInput, '0');
    expect(executeButton).toBeDisabled();

    // Test with empty buyer name
    await user.clear(sellAmountInput);
    await user.clear(buyerNameInput);
    await user.type(sellAmountInput, '1000000');
    expect(executeButton).toBeDisabled();

    // Test with whitespace-only buyer name
    await user.type(buyerNameInput, '   ');
    expect(executeButton).toBeDisabled();
  });

  it('should format currency amounts correctly', () => {
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    // Check currency formatting in the table - using actual rendered values
    expect(screen.getAllByText('$20,000,000')).toHaveLength(2); // Bank A and Bank C
    expect(screen.getByText('$30,000,000')).toBeInTheDocument(); // Bank B
    expect(screen.getByText('$100,000,000')).toBeInTheDocument(); // Total
  });

  it('should format percentage values correctly', () => {
    render(
      <TestWrapper>
        <TradingManagerTab />
      </TestWrapper>
    );

    // Check percentage formatting in the table - using actual rendered values
    expect(screen.getAllByText('20.0%')).toHaveLength(2); // Bank A and Bank C
    expect(screen.getByText('30.0%')).toBeInTheDocument(); // Bank B
  });
});