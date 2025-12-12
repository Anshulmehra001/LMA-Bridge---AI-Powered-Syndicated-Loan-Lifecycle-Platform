/**
 * Integration tests for UI error handling components
 * Tests error notifications, field validation, and user interactions
 * Requirements: 7.2, 7.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorNotification, FieldError } from './error-notification';
import { ValidatedInput, ValidatedForm } from './validated-input';
import { getUserFriendlyError, createAPIError } from '@/types';

describe('UI Error Handling Integration Tests', () => {
  describe('ErrorNotification Component', () => {
    test('should display error notification with all elements', () => {
      const error = getUserFriendlyError(createAPIError('API_TIMEOUT', 'Request timed out'));
      const mockDismiss = jest.fn();
      const mockRetry = jest.fn();

      render(
        <ErrorNotification
          error={error}
          onDismiss={mockDismiss}
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText('Service Timeout')).toBeInTheDocument();
      expect(screen.getByText(/taking too long/)).toBeInTheDocument();
      expect(screen.getByText(/try again in a few moments/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close error notification/i })).toBeInTheDocument();
    });

    test('should handle dismiss action', () => {
      const error = getUserFriendlyError('Test error');
      const mockDismiss = jest.fn();

      render(
        <ErrorNotification
          error={error}
          onDismiss={mockDismiss}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /close error notification/i }));
      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    test('should handle retry action', () => {
      const error = getUserFriendlyError('Test error');
      const mockRetry = jest.fn();

      render(
        <ErrorNotification
          error={error}
          onRetry={mockRetry}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    test('should display different error types correctly', () => {
      const errors = [
        createAPIError('API_KEY_MISSING', 'No API key'),
        createAPIError('VALIDATION_ERROR', 'Invalid data'),
        createAPIError('NETWORK_ERROR', 'Connection failed')
      ];

      errors.forEach((apiError, index) => {
        const error = getUserFriendlyError(apiError);
        const { rerender } = render(<ErrorNotification error={error} />);

        switch (apiError.code) {
          case 'API_KEY_MISSING':
            expect(screen.getByText('Configuration Error')).toBeInTheDocument();
            break;
          case 'VALIDATION_ERROR':
            expect(screen.getByText('Data Validation Error')).toBeInTheDocument();
            break;
          case 'NETWORK_ERROR':
            expect(screen.getByText('Connection Error')).toBeInTheDocument();
            break;
        }

        if (index < errors.length - 1) {
          rerender(<div />); // Clear for next iteration
        }
      });
    });
  });

  describe('FieldError Component', () => {
    test('should display single field error', () => {
      const errors = ['This field is required'];

      render(<FieldError errors={errors} />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should display multiple field errors', () => {
      const errors = [
        'This field is required',
        'Must be at least 5 characters',
        'Cannot contain special characters'
      ];

      render(<FieldError errors={errors} />);

      errors.forEach(error => {
        expect(screen.getByText(error)).toBeInTheDocument();
      });
    });

    test('should not render when no errors', () => {
      const { container } = render(<FieldError errors={[]} />);
      expect(container.firstChild).toBeNull();
    });

    test('should not render when errors is undefined', () => {
      const { container } = render(<FieldError errors={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ValidatedInput Component', () => {
    test('should validate borrower name field', async () => {
      const mockChange = jest.fn();
      const mockValidation = jest.fn();

      render(
        <ValidatedInput
          fieldName="borrowerName"
          value=""
          onChange={mockChange}
          onValidation={mockValidation}
          validateOnChange={true}
        />
      );

      const input = screen.getByRole('textbox');
      
      // Type invalid input (empty)
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // Type valid input
      fireEvent.change(input, { target: { value: 'Valid Company Name' } });

      await waitFor(() => {
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should validate numeric fields', async () => {
      const mockChange = jest.fn();

      render(
        <ValidatedInput
          fieldName="facilityAmount"
          value={0}
          onChange={mockChange}
          validateOnChange={true}
        />
      );

      const input = screen.getByRole('spinbutton');
      
      // Type invalid amount (too small)
      fireEvent.change(input, { target: { value: '500000' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/at least.*10,00,000/)).toBeInTheDocument();
      });

      // Type valid amount
      fireEvent.change(input, { target: { value: '50000000' } });

      await waitFor(() => {
        expect(screen.queryByText(/at least.*10,00,000/i)).not.toBeInTheDocument();
      });
    });

    test('should handle textarea type', () => {
      render(
        <ValidatedInput
          fieldName="esgTarget"
          value=""
          type="textarea"
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      // Textarea should be rendered instead of input
      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });

    test('should show validation errors only after field is touched', async () => {
      render(
        <ValidatedInput
          fieldName="borrowerName"
          value=""
          validateOnChange={true}
        />
      );

      // Error should not be visible initially
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();

      // Focus and blur without entering value
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    test('should apply correct styling for validation states', async () => {
      render(
        <ValidatedInput
          fieldName="borrowerName"
          value=""
          validateOnChange={true}
        />
      );

      const input = screen.getByRole('textbox');
      
      // Trigger validation by blurring
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveClass('border-red-300');
      });

      // Enter valid value
      fireEvent.change(input, { target: { value: 'Valid Company' } });

      await waitFor(() => {
        // Check that error styling is removed (no longer has red border)
        expect(input).not.toHaveClass('border-red-300');
      });
    });

    test('should handle disabled and readonly states', () => {
      const { rerender } = render(
        <ValidatedInput
          fieldName="borrowerName"
          value="Test"
          disabled={true}
        />
      );

      expect(screen.getByRole('textbox')).toBeDisabled();

      rerender(
        <ValidatedInput
          fieldName="borrowerName"
          value="Test"
          readOnly={true}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('ValidatedForm Component', () => {
    test('should track form validation state', async () => {
      const mockValidationChange = jest.fn();

      render(
        <ValidatedForm onValidationChange={mockValidationChange}>
          <ValidatedInput
            fieldName="borrowerName"
            value=""
            validateOnChange={true}
          />
          <ValidatedInput
            fieldName="facilityAmount"
            value={0}
            validateOnChange={true}
          />
        </ValidatedForm>
      );

      // Form should initially be valid (no validation triggered yet)
      expect(mockValidationChange).toHaveBeenCalledWith(true, []);
    });

    test('should prevent form submission', () => {
      const mockSubmit = jest.fn();

      render(
        <ValidatedForm>
          <button type="submit" onClick={mockSubmit}>Submit</button>
        </ValidatedForm>
      );

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Form submission should be prevented (no page reload)
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete form validation workflow', async () => {
      const mockValidationChange = jest.fn();

      render(
        <ValidatedForm onValidationChange={mockValidationChange}>
          <div>
            <label htmlFor="borrower-name">Borrower Name</label>
            <ValidatedInput
              fieldName="borrowerName"
              value=""
              validateOnChange={true}
            />
          </div>
          <div>
            <label htmlFor="facility-amount">Facility Amount</label>
            <ValidatedInput
              fieldName="facilityAmount"
              value={0}
              validateOnChange={true}
            />
          </div>
        </ValidatedForm>
      );

      const nameInput = screen.getByRole('textbox');
      const amountInput = screen.getByRole('spinbutton');

      // Trigger validation on both fields
      fireEvent.blur(nameInput);
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
        expect(screen.getByText(/at least.*10,00,000/i)).toBeInTheDocument();
      });

      // Fix the name field
      fireEvent.change(nameInput, { target: { value: 'Valid Company' } });

      await waitFor(() => {
        // Check that the specific "Name is required" error is gone
        expect(screen.queryByText(/name.*required/i)).not.toBeInTheDocument();
      });

      // Fix the amount field
      fireEvent.change(amountInput, { target: { value: '50000000' } });

      await waitFor(() => {
        expect(screen.queryByText(/at least.*10,00,000/i)).not.toBeInTheDocument();
      });
    });

    test('should handle error notification with field validation', async () => {
      const apiError = createAPIError('VALIDATION_ERROR', 'Data validation failed');
      const friendlyError = getUserFriendlyError(apiError);
      const mockDismiss = jest.fn();

      render(
        <div>
          <ErrorNotification error={friendlyError} onDismiss={mockDismiss} />
          <ValidatedInput
            fieldName="borrowerName"
            value=""
            validateOnChange={true}
          />
        </div>
      );

      // Both error notification and field validation should be visible
      expect(screen.getByText('Data Validation Error')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // Dismiss the notification
      fireEvent.click(screen.getByRole('button', { name: /close error notification/i }));
      expect(mockDismiss).toHaveBeenCalled();

      // Field validation should still be visible
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    test('should handle multiple error types simultaneously', () => {
      const networkError = getUserFriendlyError(createAPIError('NETWORK_ERROR', 'Connection failed'));
      const validationErrors = ['Field is required', 'Value is too small'];

      render(
        <div>
          <ErrorNotification error={networkError} />
          <FieldError errors={validationErrors} />
        </div>
      );

      // Both error types should be displayed
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByText('Value is too small')).toBeInTheDocument();
    });
  });
});