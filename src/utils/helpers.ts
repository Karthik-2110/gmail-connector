import { EmailHeader } from '../types';

/**
 * Decode base64url encoded string
 */
export function decodeBase64Url(str: string): string {
  try {
    // Replace URL-safe characters and add padding if needed
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (error) {
    return '';
  }
}

/**
 * Extract header value by name
 */
export function getHeaderValue(headers: EmailHeader[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

/**
 * Parse email addresses from header value
 */
export function parseEmailAddresses(headerValue: string): string[] {
  if (!headerValue) return [];
  
  // Simple email extraction - can be enhanced for complex cases
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = headerValue.match(emailRegex);
  return matches || [];
}

/**
 * Format date from Gmail internal date
 */
export function formatGmailDate(internalDate: string): Date {
  return new Date(parseInt(internalDate));
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}