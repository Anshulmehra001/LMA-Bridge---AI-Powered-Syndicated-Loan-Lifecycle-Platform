import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { FieldError } from './error-notification';
import { validateField, ValidationResult } from '@/types';
import { LoanData } from '@/types';

interface ValidatedInputProps {
  fieldName: keyof LoanData;
  value: string | number;
  onChange?: (value: string | number, isValid: boolean) => void;
  onValidation?: (result: ValidationResult) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  type?: 'input' | 'textarea';
  showErrors?: boolean;
  validateOnChange?: boolean;
}

export function ValidatedInput({
  fieldName,
  value,
  onChange,
  onValidation,
  placeholder,
  disabled = false,
  readOnly = false,
  className = '',
  type = 'input',
  showErrors = true,
  validateOnChange = true
}: ValidatedInputProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Validate the current value
  useEffect(() => {
    if (validateOnChange && hasBeenTouched) {
      const result = validateField(fieldName, value);
      if (result.isValid !== validationResult.isValid || result.errors.length !== validationResult.errors.length) {
        setValidationResult(result);
        onValidation?.(result);
      }
    }
  }, [fieldName, value, validateOnChange, hasBeenTouched, validationResult.isValid, validationResult.errors.length, onValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setHasBeenTouched(true);
    
    // Convert to number for numeric fields
    const processedValue = ['facilityAmount', 'interestRateMargin', 'leverageCovenant'].includes(fieldName)
      ? (newValue === '' ? 0 : parseFloat(newValue) || 0)
      : newValue;
    
    // Validate immediately on change
    if (validateOnChange) {
      const result = validateField(fieldName, processedValue);
      setValidationResult(result);
      onValidation?.(result);
      onChange?.(processedValue, result.isValid);
    } else {
      onChange?.(processedValue, validationResult.isValid);
    }
  };

  const handleBlur = () => {
    setHasBeenTouched(true);
  };

  const inputClassName = `
    ${className}
    ${!validationResult.isValid && hasBeenTouched ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${validationResult.isValid && hasBeenTouched && value ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}
  `.trim();

  const displayValue = typeof value === 'number' ? value.toString() : value;

  return (
    <div className="space-y-1">
      {type === 'textarea' ? (
        <Textarea
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={inputClassName}
        />
      ) : (
        <Input
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={inputClassName}
          type={['facilityAmount', 'interestRateMargin', 'leverageCovenant'].includes(fieldName) ? 'number' : 'text'}
          step={fieldName === 'interestRateMargin' || fieldName === 'leverageCovenant' ? '0.01' : undefined}
          min={fieldName === 'facilityAmount' ? '1000000' : fieldName === 'interestRateMargin' || fieldName === 'leverageCovenant' ? '0.01' : undefined}
        />
      )}
      
      {showErrors && hasBeenTouched && !validationResult.isValid && (
        <FieldError errors={validationResult.errors} />
      )}
    </div>
  );
}

interface ValidatedFormProps {
  children: React.ReactNode;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  className?: string;
}

export function ValidatedForm({ children, onValidationChange, className = '' }: ValidatedFormProps) {
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(true);

  useEffect(() => {
    onValidationChange?.(isFormValid, formErrors);
  }, [isFormValid, formErrors, onValidationChange]);

  return (
    <form className={className} onSubmit={(e) => e.preventDefault()}>
      {children}
    </form>
  );
}