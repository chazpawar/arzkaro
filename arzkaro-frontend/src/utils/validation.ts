/**
 * Validation Utilities for Host KYC Form
 * Matches validation patterns from mobile app
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate PAN number format: ABCDE1234F
 * Pattern: 5 uppercase letters + 4 digits + 1 uppercase letter
 */
export function validatePAN(pan: string): ValidationResult {
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  
  if (!pan) {
    return { isValid: false, error: 'PAN number is required' };
  }
  
  if (!pattern.test(pan)) {
    return { isValid: false, error: 'Enter a valid PAN (e.g., ABCDE1234F)' };
  }
  
  return { isValid: true };
}

/**
 * Validate phone number: 10 digits
 * Mobile format without country code
 */
export function validatePhone(phone: string): ValidationResult {
  const pattern = /^\d{10}$/;
  
  if (!phone) {
    return { isValid: false, error: 'Contact number is required' };
  }
  
  if (!pattern.test(phone)) {
    return { isValid: false, error: 'Enter a valid 10-digit number' };
  }
  
  return { isValid: true };
}

/**
 * Validate IFSC code: ABCD0123456
 * Pattern: 4 uppercase letters + 0 + 6 alphanumeric characters
 */
export function validateIFSC(ifsc: string): ValidationResult {
  const pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  
  if (!ifsc) {
    return { isValid: false, error: 'IFSC code is required' };
  }
  
  if (!pattern.test(ifsc)) {
    return { isValid: false, error: 'Enter a valid IFSC code (e.g., SBIN0001234)' };
  }
  
  return { isValid: true };
}

/**
 * Validate PIN code: 6 digits
 */
export function validatePIN(pin: string): ValidationResult {
  const pattern = /^\d{6}$/;
  
  if (!pin) {
    return { isValid: false, error: 'PIN code is required' };
  }
  
  if (!pattern.test(pin)) {
    return { isValid: false, error: 'Enter a valid 6-digit PIN code' };
  }
  
  return { isValid: true };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email address is required' };
  }
  
  if (!pattern.test(email)) {
    return { isValid: false, error: 'Enter a valid email address' };
  }
  
  return { isValid: true };
}

/**
 * Validate GSTIN: 22AAAAA0000A1Z5
 * Pattern: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit/letter + Z + 1 alphanumeric
 * Optional field
 */
export function validateGSTIN(gstin: string): ValidationResult {
  // GSTIN is optional
  if (!gstin || gstin.trim() === '') {
    return { isValid: true };
  }
  
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;
  
  if (!pattern.test(gstin)) {
    return { isValid: false, error: 'Enter a valid GSTIN' };
  }
  
  return { isValid: true };
}

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName: string, minLength = 2): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (value.trim().length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  return { isValid: true };
}

/**
 * Validate account number (minimum 9 digits)
 */
export function validateAccountNumber(accountNumber: string): ValidationResult {
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required' };
  }
  
  if (accountNumber.length < 9) {
    return { isValid: false, error: 'Account number must be at least 9 digits' };
  }
  
  return { isValid: true };
}

/**
 * Auto-format phone number as user types
 * Returns formatted string
 */
export function formatPhone(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  return digits.slice(0, 10);
}

/**
 * Auto-format PAN as user types
 * Returns uppercase string
 */
export function formatPAN(value: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Limit to 10 characters
  return cleaned.slice(0, 10);
}

/**
 * Auto-format IFSC as user types
 * Returns uppercase string
 */
export function formatIFSC(value: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Limit to 11 characters
  return cleaned.slice(0, 11);
}

/**
 * Auto-format GSTIN as user types
 * Returns uppercase string
 */
export function formatGSTIN(value: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Limit to 15 characters
  return cleaned.slice(0, 15);
}

/**
 * Auto-format PIN code as user types
 * Returns numeric string
 */
export function formatPIN(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 6 digits
  return digits.slice(0, 6);
}
