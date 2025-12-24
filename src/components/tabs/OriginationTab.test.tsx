import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '@/contexts/ApplicationContext';
import { OriginationTab } from './OriginationTab';
import { analyzeLoan } from '@/actions/analyzeLoan';
import { LoanData } from '@/types';

// Mock the analyzeLoan action
jest.mock('@/actions/analyzeLoan');
const mockAnalyzeLoan = analyzeLoan as jest.MockedFunction<typeof analyzeLoan>;

// Mock document processor
jest.mock('@/lib/document-processor', () => ({
  processDocument: jest.fn(),
  validateFile: jest.fn(() => ({ isValid: true }))
}));

// Helper function to render component with context
const renderWithContext = (component: React.ReactElement) => {
  return render(
    <ApplicationProvider>
      {component}
    </ApplicationProvider>
  );
};

describe('OriginationTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithContext(<OriginationTab />);
      expect(screen.getByText('Loan Origination')).toBeInTheDocument();
    });

    it('should render basic UI elements', () => {
      renderWithContext(<OriginationTab />);
      
      // Check for basic elements that should always be present
      expect(screen.getByText('Loan Origination')).toBeInTheDocument();
      expect(screen.getByText('Use Sample')).toBeInTheDocument();
      expect(screen.getByText('Analyze Document')).toBeInTheDocument();
    });
  });

  describe('Document Analysis Mode', () => {
    it('should show file upload and text input options', () => {
      renderWithContext(<OriginationTab />);
      
      expect(screen.getByText('Choose File')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Paste your loan agreement text here for AI analysis...')).toBeInTheDocument();
      expect(screen.getByText('Use Sample')).toBeInTheDocument();
    });

    it('should populate sample data when Use Sample is clicked', () => {
      renderWithContext(<OriginationTab />);
      
      const useSampleButton = screen.getByText('Use Sample');
      fireEvent.click(useSampleButton);
      
      const textArea = screen.getByPlaceholderText('Paste your loan agreement text here for AI analysis...');
      expect(textArea).toHaveValue(expect.stringContaining('REVOLVING CREDIT AGREEMENT'));
      expect(textArea).toHaveValue(expect.stringContaining('TECHCORP INDUSTRIES INC.'));
    });

    it('should analyze document and show extracted data', async () => {
      const testLoanData: LoanData = {
        borrowerName: 'Test Corporation',
        facilityAmount: 50000000,
        currency: 'USD',
        interestRateMargin: 2.5,
        leverageCovenant: 4.0,
        esgTarget: 'Reduce carbon emissions by 25%'
      };

      mockAnalyzeLoan.mockResolvedValue({
        success: true,
        data: testLoanData,
        isMockData: false,
        error: undefined
      });

      renderWithContext(<OriginationTab />);

      const textArea = screen.getByPlaceholderText('Paste your loan agreement text here for AI analysis...');
      const analyzeButton = screen.getByText('Analyze Document');

      fireEvent.change(textArea, { target: { value: 'Sample loan document text' } });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue(testLoanData.borrowerName)).toBeInTheDocument();
      });

      // Check that extracted data is displayed
      expect(screen.getByDisplayValue('50,000,000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    });

    it('should show success message after successful extraction', async () => {
      const testLoanData: LoanData = {
        borrowerName: 'Test Corp',
        facilityAmount: 100000000,
        currency: 'USD',
        interestRateMargin: 3.0,
        leverageCovenant: 5.0,
        esgTarget: 'Carbon neutral by 2030'
      };

      mockAnalyzeLoan.mockResolvedValue({
        success: true,
        data: testLoanData,
        isMockData: false
      });

      renderWithContext(<OriginationTab />);

      const textArea = screen.getByPlaceholderText('Paste your loan agreement text here for AI analysis...');
      const analyzeButton = screen.getByText('Analyze Document');

      fireEvent.change(textArea, { target: { value: 'Sample document' } });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Smart AI Extraction Successful')).toBeInTheDocument();
      });
    });

    it('should show error message when analysis fails', async () => {
      mockAnalyzeLoan.mockResolvedValue({
        success: false,
        error: 'Analysis failed',
        isMockData: false
      });

      renderWithContext(<OriginationTab />);

      const textArea = screen.getByPlaceholderText('Paste your loan agreement text here for AI analysis...');
      const analyzeButton = screen.getByText('Analyze Document');

      fireEvent.change(textArea, { target: { value: 'Sample document' } });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Analysis failed. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty document text', () => {
      renderWithContext(<OriginationTab />);
      
      const analyzeButton = screen.getByText('Analyze Document');
      fireEvent.click(analyzeButton);
      
      expect(screen.getByText(/Please enter loan document text before analyzing/)).toBeInTheDocument();
    });
  });

  describe('UI State Management', () => {
    it('should show loading state during analysis', async () => {
      mockAnalyzeLoan.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {
          borrowerName: 'Test Corp',
          facilityAmount: 100000000,
          currency: 'USD',
          interestRateMargin: 2.5,
          leverageCovenant: 4.0,
          esgTarget: 'Test target'
        },
        isMockData: false
      }), 100)));

      renderWithContext(<OriginationTab />);

      const textArea = screen.getByPlaceholderText('Paste your loan agreement text here for AI analysis...');
      const analyzeButton = screen.getByText('Analyze Document');

      fireEvent.change(textArea, { target: { value: 'Sample document' } });
      fireEvent.click(analyzeButton);

      // Should show loading state
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
      expect(analyzeButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Analyzing...')).not.toBeInTheDocument();
      });
    });
  });
});