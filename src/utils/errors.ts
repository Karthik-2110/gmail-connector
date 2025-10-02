export class GmailConnectorError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GmailConnectorError';
  }
}

export class AuthenticationError extends GmailConnectorError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class APIError extends GmailConnectorError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

export class ConfigurationError extends GmailConnectorError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class RateLimitError extends GmailConnectorError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}