const { GmailConnector } = require('../dist/index');

// Mock the googleapis library
jest.mock('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          list: jest.fn(),
          get: jest.fn(),
          modify: jest.fn()
        },
        getProfile: jest.fn(),
        labels: {
          list: jest.fn()
        }
      }
    })),
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
        getAccessToken: jest.fn(),
        generateAuthUrl: jest.fn(() => 'https://mock-auth-url.com'),
        getToken: jest.fn(() => Promise.resolve({
          tokens: {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000
          }
        })),
        revokeToken: jest.fn()
      }))
    }
  }
}));

describe('GmailConnector', () => {
  let gmail;
  const mockConfig = {
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret',
    redirectUri: 'http://localhost:3000/callback'
  };

  beforeEach(() => {
    gmail = new GmailConnector(mockConfig);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create instance with valid config', () => {
      expect(gmail).toBeInstanceOf(GmailConnector);
    });

    test('should throw error with invalid config', () => {
      expect(() => new GmailConnector({})).toThrow('Client ID is required');
    });

    test('should throw error without client secret', () => {
      expect(() => new GmailConnector({ clientId: 'test' })).toThrow('Client secret is required');
    });

    test('should throw error without redirect URI', () => {
      expect(() => new GmailConnector({ 
        clientId: 'test', 
        clientSecret: 'test' 
      })).toThrow('Redirect URI is required');
    });
  });

  describe('Authentication', () => {
    test('should generate auth URL', () => {
      const authUrl = gmail.getAuthUrl();
      expect(authUrl).toBe('https://mock-auth-url.com');
    });

    test('should authenticate with code', async () => {
      await gmail.authenticate('test_code');
      // Should not throw error
      expect(true).toBe(true);
    });

    test('should authenticate with tokens', async () => {
      const mockTokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
      };

      await gmail.authenticateWithTokens(mockTokens);
      expect(gmail.getTokens()).toEqual(mockTokens);
    });

    test('should get current tokens', async () => {
      await gmail.authenticate('test_code');
      const tokens = gmail.getTokens();
      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
    });
  });

  describe('Email Operations', () => {
    beforeEach(async () => {
      // Mock authentication
      await gmail.authenticate('test_code');
    });

    test('should fetch emails with default parameters', async () => {
      const mockMessages = {
        data: {
          messages: [
            { id: '1', threadId: 'thread1' },
            { id: '2', threadId: 'thread2' }
          ]
        }
      };

      const mockMessage = {
        data: {
          id: '1',
          payload: {
            headers: [
              { name: 'Subject', value: 'Test Subject' },
              { name: 'From', value: 'test@example.com' },
              { name: 'Date', value: 'Mon, 1 Jan 2024 12:00:00 +0000' }
            ],
            body: { data: 'VGVzdCBib2R5' }, // Base64 encoded "Test body"
            parts: []
          },
          snippet: 'Test snippet'
        }
      };

      // Mock the Gmail API calls
      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.messages.list.mockResolvedValue(mockMessages);
      mockGmail.users.messages.get.mockResolvedValue(mockMessage);

      const emails = await gmail.getEmails();
      expect(emails).toHaveLength(2);
      expect(emails[0]).toHaveProperty('subject', 'Test Subject');
      expect(emails[0]).toHaveProperty('from', 'test@example.com');
    });

    test('should search emails with query', async () => {
      const mockMessages = {
        data: {
          messages: [{ id: '1', threadId: 'thread1' }]
        }
      };

      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.messages.list.mockResolvedValue(mockMessages);
      mockGmail.users.messages.get.mockResolvedValue({
        data: {
          id: '1',
          payload: {
            headers: [
              { name: 'Subject', value: 'Search Result' },
              { name: 'From', value: 'search@example.com' }
            ],
            body: { data: '' },
            parts: []
          },
          snippet: 'Search snippet'
        }
      });

      const emails = await gmail.searchEmails('from:search@example.com');
      expect(mockGmail.users.messages.list).toHaveBeenCalledWith({
        userId: 'me',
        q: 'from:search@example.com',
        maxResults: 10,
        includeSpamTrash: false
      });
    });

    test('should get unread emails', async () => {
      const mockMessages = {
        data: {
          messages: [{ id: '1', threadId: 'thread1' }]
        }
      };

      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.messages.list.mockResolvedValue(mockMessages);

      await gmail.getUnreadEmails(5);
      expect(mockGmail.users.messages.list).toHaveBeenCalledWith({
        userId: 'me',
        q: 'is:unread',
        maxResults: 5,
        includeSpamTrash: false
      });
    });

    test('should mark email as read', async () => {
      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.messages.modify.mockResolvedValue({ data: {} });

      await gmail.markAsRead('test_message_id');
      expect(mockGmail.users.messages.modify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'test_message_id',
        resource: {
          removeLabelIds: ['UNREAD']
        }
      });
    });

    test('should mark email as unread', async () => {
      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.messages.modify.mockResolvedValue({ data: {} });

      await gmail.markAsUnread('test_message_id');
      expect(mockGmail.users.messages.modify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'test_message_id',
        resource: {
          addLabelIds: ['UNREAD']
        }
      });
    });
  });

  describe('Profile and Labels', () => {
    beforeEach(async () => {
      await gmail.authenticate('test_code');
    });

    test('should get user profile', async () => {
      const mockProfile = {
        data: {
          emailAddress: 'test@gmail.com',
          messagesTotal: 1000,
          threadsTotal: 500
        }
      };

      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.getProfile.mockResolvedValue(mockProfile);

      const profile = await gmail.getProfile();
      expect(profile.emailAddress).toBe('test@gmail.com');
      expect(profile.messagesTotal).toBe(1000);
    });

    test('should get labels', async () => {
      const mockLabels = {
        data: {
          labels: [
            { id: 'INBOX', name: 'INBOX' },
            { id: 'SENT', name: 'SENT' }
          ]
        }
      };

      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.labels.list.mockResolvedValue(mockLabels);

      const labels = await gmail.getLabels();
      expect(labels).toHaveLength(2);
      expect(labels[0].name).toBe('INBOX');
    });
  });

  describe('Error Handling', () => {
    test('should throw error when not authenticated', async () => {
      await expect(gmail.getEmails()).rejects.toThrow('Not authenticated');
    });

    test('should handle API errors gracefully', async () => {
      await gmail.authenticate('test_code');
      
      const { google } = require('googleapis');
      const mockGmail = google.gmail();
      mockGmail.users.messages.list.mockRejectedValue(new Error('API Error'));

      await expect(gmail.getEmails()).rejects.toThrow('API Error');
    });
  });

  describe('Token Management', () => {
    test('should refresh tokens', async () => {
      await gmail.authenticate('test_code');
      
      const { google } = require('googleapis');
      const mockAuth = new google.auth.OAuth2();
      mockAuth.getAccessToken.mockResolvedValue({
        token: 'new_access_token'
      });

      await gmail.refreshTokens();
      // Should not throw error
      expect(true).toBe(true);
    });

    test('should revoke access', async () => {
      await gmail.authenticate('test_code');
      
      const { google } = require('googleapis');
      const mockAuth = new google.auth.OAuth2();
      mockAuth.revokeToken.mockResolvedValue({});

      await gmail.revokeAccess();
      expect(gmail.getTokens()).toBeNull();
    });
  });
});