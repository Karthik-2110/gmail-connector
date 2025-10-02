import { OAuthHandler } from './auth/oauth';
import { GmailClient } from './client/gmail-client';
import { GmailConnectorConfig, EmailFilter, ParsedEmail, AuthTokens } from './types';
import { ConfigurationError, AuthenticationError } from './utils/errors';

export class GmailConnector {
  private oauthHandler: OAuthHandler;
  private gmailClient: GmailClient | null = null;
  private isAuthenticated = false;

  constructor(config: GmailConnectorConfig) {
    this.oauthHandler = new OAuthHandler(config);
  }

  /**
   * Start the authentication process
   * Returns the authorization URL that user needs to visit
   */
  getAuthUrl(): string {
    return this.oauthHandler.getAuthUrl();
  }

  /**
   * Complete authentication with authorization code
   */
  async authenticate(authCode?: string): Promise<void> {
    if (!authCode) {
      throw new AuthenticationError('Authorization code is required for authentication');
    }

    try {
      const tokens = await this.oauthHandler.getTokens(authCode);
      this.oauthHandler.setCredentials(tokens);
      this.gmailClient = new GmailClient(this.oauthHandler.getOAuth2Client());
      this.isAuthenticated = true;
    } catch (error) {
      throw new AuthenticationError(`Authentication failed: ${error}`);
    }
  }

  /**
   * Authenticate with existing tokens
   */
  async authenticateWithTokens(tokens: AuthTokens): Promise<void> {
    try {
      this.oauthHandler.setCredentials(tokens);
      
      // Check if tokens are still valid
      const isValid = await this.oauthHandler.isTokenValid();
      if (!isValid) {
        // Try to refresh tokens
        const refreshedTokens = await this.oauthHandler.refreshAccessToken();
        this.oauthHandler.setCredentials(refreshedTokens);
      }

      this.gmailClient = new GmailClient(this.oauthHandler.getOAuth2Client());
      this.isAuthenticated = true;
    } catch (error) {
      throw new AuthenticationError(`Token authentication failed: ${error}`);
    }
  }

  /**
   * Get emails with optional filtering
   */
  async getEmails(filter: EmailFilter = {}): Promise<ParsedEmail[]> {
    this.ensureAuthenticated();
    return this.gmailClient!.getMessages(filter);
  }

  /**
   * Get a single email by ID
   */
  async getEmail(messageId: string): Promise<ParsedEmail> {
    this.ensureAuthenticated();
    return this.gmailClient!.getMessage(messageId);
  }

  /**
   * Search emails with query string
   */
  async searchEmails(query: string, maxResults: number = 10): Promise<ParsedEmail[]> {
    this.ensureAuthenticated();
    return this.gmailClient!.searchEmails(query, maxResults);
  }

  /**
   * Get unread emails
   */
  async getUnreadEmails(maxResults: number = 10): Promise<ParsedEmail[]> {
    this.ensureAuthenticated();
    return this.gmailClient!.getUnreadEmails(maxResults);
  }

  /**
   * Get emails from specific sender
   */
  async getEmailsFromSender(senderEmail: string, maxResults: number = 10): Promise<ParsedEmail[]> {
    this.ensureAuthenticated();
    return this.gmailClient!.getEmailsFromSender(senderEmail, maxResults);
  }

  /**
   * Get emails with specific label
   */
  async getEmailsWithLabel(labelName: string, maxResults: number = 10): Promise<ParsedEmail[]> {
    this.ensureAuthenticated();
    return this.gmailClient!.getEmailsWithLabel(labelName, maxResults);
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<any> {
    this.ensureAuthenticated();
    return this.gmailClient!.getProfile();
  }

  /**
   * Get available labels
   */
  async getLabels(): Promise<any[]> {
    this.ensureAuthenticated();
    return this.gmailClient!.getLabels();
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    this.ensureAuthenticated();
    return this.gmailClient!.markAsRead(messageId);
  }

  /**
   * Mark email as unread
   */
  async markAsUnread(messageId: string): Promise<void> {
    this.ensureAuthenticated();
    return this.gmailClient!.markAsUnread(messageId);
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get current access tokens (for storage/reuse)
   */
  getTokens(): AuthTokens | null {
    if (!this.isAuthenticated) {
      return null;
    }

    const credentials = this.oauthHandler.getOAuth2Client().credentials;
    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || undefined,
      scope: credentials.scope || '',
      token_type: credentials.token_type || 'Bearer',
      expiry_date: credentials.expiry_date || undefined
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(): Promise<AuthTokens> {
    this.ensureAuthenticated();
    return this.oauthHandler.refreshAccessToken();
  }

  /**
   * Revoke authentication tokens
   */
  async revokeAccess(): Promise<void> {
    this.ensureAuthenticated();
    await this.oauthHandler.revokeTokens();
    this.isAuthenticated = false;
    this.gmailClient = null;
  }

  /**
   * Ensure user is authenticated before API calls
   */
  private ensureAuthenticated(): void {
    if (!this.isAuthenticated || !this.gmailClient) {
      throw new AuthenticationError('User must be authenticated before accessing Gmail API');
    }
  }
}

// Export types and errors for external use
export * from './types';
export * from './utils/errors';

// Default export
export default GmailConnector;