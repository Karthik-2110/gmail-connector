import { OAuth2Client } from 'google-auth-library';
import { GmailConnectorConfig, AuthTokens } from '../types';
import { AuthenticationError, ConfigurationError } from '../utils/errors';

export class OAuthHandler {
  private oauth2Client: OAuth2Client;
  private scopes: string[];

  constructor(config: GmailConnectorConfig) {
    this.validateConfig(config);
    
    this.scopes = config.scopes || [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  private validateConfig(config: GmailConnectorConfig): void {
    if (!config.clientId) {
      throw new ConfigurationError('Client ID is required');
    }
    if (!config.clientSecret) {
      throw new ConfigurationError('Client Secret is required');
    }
    if (!config.redirectUri) {
      throw new ConfigurationError('Redirect URI is required');
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<AuthTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new AuthenticationError('Failed to obtain access token');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        scope: tokens.scope || this.scopes.join(' '),
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || undefined
      };
    } catch (error) {
      throw new AuthenticationError(`Token exchange failed: ${error}`);
    }
  }

  /**
   * Set credentials for the OAuth client
   */
  setCredentials(tokens: AuthTokens): void {
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || undefined,
        scope: credentials.scope || this.scopes.join(' '),
        token_type: credentials.token_type || 'Bearer',
        expiry_date: credentials.expiry_date || undefined
      };
    } catch (error) {
      throw new AuthenticationError(`Token refresh failed: ${error}`);
    }
  }

  /**
   * Check if current tokens are valid
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const tokenInfo = await this.oauth2Client.getTokenInfo(
        this.oauth2Client.credentials.access_token!
      );
      return !!tokenInfo.scopes;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the configured OAuth2 client
   */
  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }

  /**
   * Revoke tokens
   */
  async revokeTokens(): Promise<void> {
    try {
      await this.oauth2Client.revokeCredentials();
    } catch (error) {
      throw new AuthenticationError(`Token revocation failed: ${error}`);
    }
  }
}