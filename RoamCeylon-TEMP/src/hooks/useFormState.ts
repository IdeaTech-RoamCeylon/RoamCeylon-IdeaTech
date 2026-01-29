import { useState, useCallback } from 'react';

interface ValidationRule {
  validate: (value: string) => boolean;
  errorMessage: string;
}

interface UseFormStateOptions {
  validation?: ValidationRule;
  initialValue?: string;
}

interface UseFormStateReturn {
  value: string;
  error: string;
  setValue: (value: string) => void;
  setError: (error: string) => void;
  validate: () => boolean;
  reset: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing form input state with validation
 * 
 * @param options - Configuration options including validation rules and initial value
 * @returns Object containing value, error, and helper functions
 * 
 * @example
 * ```typescript
 * const phone = useFormState({
 *   validation: {
 *     validate: (value) => value.length >= 10,
 *     errorMessage: 'Please enter a valid phone number'
 *   }
 * });
 * 
 * <Input
 *   value={phone.value}
 *   onChangeText={phone.setValue}
 *   error={phone.error}
 * />
 * ```
 */
export function useFormState(
  options: UseFormStateOptions = {}
): UseFormStateReturn {
  const { validation, initialValue = '' } = options;
  
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSetValue = useCallback((newValue: string) => {
    setValue(newValue);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  }, [error]);

  const validate = useCallback((): boolean => {
    if (!validation) return true;
    
    const isValid = validation.validate(value);
    if (!isValid) {
      setError(validation.errorMessage);
    }
    return isValid;
  }, [value, validation]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError('');
  }, [initialValue]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    value,
    error,
    setValue: handleSetValue,
    setError,
    validate,
    reset,
    clearError,
  };
}
