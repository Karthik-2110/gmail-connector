import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { EmailFilter, EmailMessage, ParsedEmail } from '../types';
import { EmailParser } from './email-parser';
import { APIError, RateLimitError } from '../utils/errors';
import { retryWithBackoff } from '../utils/helpers';

export class GmailClient {
  private gmail: any;
  private oauth2Client: OAuth2Client;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Get list of email messages
   */
  async getMessages(filter: EmailFilter = {}): Promise<ParsedEmail[]> {
    try {
      const {
        maxResults = 10,
        query = '',
        labelIds = [],
        includeSpamTrash = false
      } = filter;

      // Get message list
      const listResponse = await retryWithBackoff(async () => {
        return await this.gmail.users.messages.list({
          userId: 'me',
          maxResults,
          q: query,
          labelIds: labelIds.length > 0 ? labelIds : undefined,
          includeSpamTrash
        });
      });

      if (!listResponse.data.messages) {
        return [];
      }

      // Get full message details
      const messages: EmailMessage[] = [];
      const messageIds = listResponse.data.messages.map((msg: any) => msg.id);

      // Batch get messages for better performance
      for (const messageId of messageIds) {
        const messageResponse = await retryWithBackoff(async () => {
          return await this.gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
          });
        });

        messages.push(messageResponse.data);
      }

      // Parse messages to readable format
      return EmailParser.parseMessages(messages);

    } catch (error: any) {
      this.handleApiError(error);
      throw error; // This won't be reached due to handleApiError throwing
    }
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<ParsedEmail> {
    try {
      const response = await retryWithBackoff(async () => {
        return await this.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full'
        });
      });

      return EmailParser.parseMessage(response.data);

    } catch (error: any) {
      this.handleApiError(error);
      throw error; // This won't be reached due to handleApiError throwing
    }
  }

  /**
   * Search emails with query
   */
  async searchEmails(query: string, maxResults: number = 10): Promise<ParsedEmail[]> {
    return this.getMessages({ query, maxResults });
  }

  /**
   * Get unread emails
   */
  async getUnreadEmails(maxResults: number = 10): Promise<ParsedEmail[]> {
    return this.getMessages({ query: 'is:unread', maxResults });
  }

  /**
   * Get emails from specific sender
   */
  async getEmailsFromSender(senderEmail: string, maxResults: number = 10): Promise<ParsedEmail[]> {
    return this.getMessages({ query: `from:${senderEmail}`, maxResults });
  }

  /**
   * Get emails with specific label
   */
  async getEmailsWithLabel(labelName: string, maxResults: number = 10): Promise<ParsedEmail[]> {
    return this.getMessages({ query: `label:${labelName}`, maxResults });
  }

  /**
   * Get user profile information
   */
  async getProfile(): Promise<any> {
    try {
      const response = await retryWithBackoff(async () => {
        return await this.gmail.users.getProfile({
          userId: 'me'
        });
      });

      return response.data;

    } catch (error: any) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get list of labels
   */
  async getLabels(): Promise<any[]> {
    try {
      const response = await retryWithBackoff(async () => {
        return await this.gmail.users.labels.list({
          userId: 'me'
        });
      });

      return response.data.labels || [];

    } catch (error: any) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await retryWithBackoff(async () => {
        return await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      });

    } catch (error: any) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(messageId: string): Promise<void> {
    try {
      await retryWithBackoff(async () => {
        return await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['UNREAD']
          }
        });
      });

    } catch (error: any) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Handle API errors and convert to custom error types
   */
  private handleApiError(error: any): never {
    if (error.code === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      throw new RateLimitError(
        'Gmail API rate limit exceeded',
        retryAfter ? parseInt(retryAfter) * 1000 : undefined
      );
    }

    if (error.code >= 400 && error.code < 500) {
      throw new APIError(`Gmail API client error: ${error.message}`, error.code);
    }

    if (error.code >= 500) {
      throw new APIError(`Gmail API server error: ${error.message}`, error.code);
    }

    throw new APIError(`Gmail API error: ${error.message}`, error.code);
  }
}