/**
 * Integration Tests for LMA Bridge Application
 * Tests basic functionality without complex tab navigation
 * Requirements: All requirements
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '@/contexts/ApplicationContext';
import Home from './page';
import { analyzeLoan } from '@/actions/analyzeLoan';

// Mock the analyzeLoan action
jest.mock('@/actions/analyzeLoan');
const mockAnalyzeLoan = analyzeLoan as jest.MockedFunction<typeof analyzeLoan>;

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: Promise.resolve({
          text: () => JSON.stringify({
            borrowerName: 'Test Corporation Ltd',
            facilityAmount: 100000000,
            currency: 'USD',
            interestRateMargin: 3.0,
            leverageCovenant: 4.5,
            esgTarget: 'Achieve carbon neutrality by 2030'
          })
        })
      })
    })
  }))
}));

describe('LMA Bridge Integration Tests', () => {
  const renderApp = () => {
    return render(
      <ApplicationProvider>
        <Home />
      </ApplicationProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up successful mock response by default
    mockAnalyzeLoan.mockResolvedValue({
      success: true,
      isMockData: false,
      data: {
        borrowerName: 'Test Corporation Ltd',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 3.0,
        leverageCovenant: 4.5,
        esgTarget: 'Achieve carbon neutrality by 2030'
      }
    });
  });

  describe('Basic Workflow Integration', () => {
    test('should complete basic origination workflow', async () => {
      renderApp();

      // Check initial state
      expect(screen.getByText('Live Mode')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Origination' })).toHaveAttribute('data-state', 'active');

      // Enable demo mode
      fireEvent.click(screen.getByRole('button', { name: /toggle demo/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
      });

      // Analyze document
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
      
      await waitFor(() => {
        // In demo mode, it should show ACME Corporation (from demo data)
        const borrowerInput = screen.getByDisplayValue('ACME Corporation');
        expect(borrowerInput).toBeInTheDocument();
        expect(borrowerInput).toHaveAttribute('readonly');
      });

      // Verify and lock data
      fireEvent.click(screen.getByRole('button', { name: /verify & lock/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Verified')).toBeInTheDocument();
      });
    });

    test('should handle error scenarios gracefully', async () => {
      renderApp();

      // Mock API failure
      mockAnalyzeLoan.mockResolvedValueOnce({
        success: true,
        isMockData: true,
        error: 'API_KEY_MISSING',
        data: {
          borrowerName: 'Mock Corporation',
          facilityAmount: 50000000,
          currency: 'USD',
          interestRateMargin: 2.5,
          leverageCovenant: 3.5,
          esgTarget: 'Mock ESG target'
        }
      });

      // Add some text and analyze
      const textArea = screen.getByPlaceholderText(/paste your loan agreement/i);
      fireEvent.change(textArea, { target: { value: 'Invalid document content' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
      
      await waitFor(() => {
        // Should show mock data
        const borrowerInput = screen.getByDisplayValue('Mock Corporation');
        expect(borrowerInput).toBeInTheDocument();
      });
    });
  });

  describe('UI Component Integration', () => {
    test('should display all main UI components', async () => {
      renderApp();

      // Check header
      expect(screen.getByText('LMA Bridge')).toBeInTheDocument();
      expect(screen.getByText('Syndicated Loan Lifecycle Platform')).toBeInTheDocument();

      // Check tabs are present
      expect(screen.getByRole('tab', { name: 'Origination' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'ESG Manager' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Risk Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Trading Manager' })).toBeInTheDocument();

      // Check origination tab content (default active)
      expect(screen.getByPlaceholderText(/paste your loan agreement/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();

      // Check footer
      expect(screen.getByText(/LMA Bridge.*Syndicated Loan/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle demo/i })).toBeInTheDocument();
    });

    test('should handle demo mode toggle correctly', async () => {
      renderApp();

      // Initially in live mode
      expect(screen.getByText('Live Mode')).toBeInTheDocument();

      // Toggle to demo mode
      fireEvent.click(screen.getByRole('button', { name: /toggle demo/i }));

      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
      });

      // Verify demo data is pre-filled
      const textArea = screen.getByPlaceholderText(/paste your loan agreement/i);
      expect(textArea.value).toContain('CREDIT AGREEMENT');

      // Toggle back to live mode
      fireEvent.click(screen.getByRole('button', { name: /toggle demo/i }));

      await waitFor(() => {
        expect(screen.getByText('Live Mode')).toBeInTheDocument();
        // Text area should be cleared
        expect(textArea.value).toBe('');
      });
    });
  });
});