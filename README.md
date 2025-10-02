# Gmail API Connector

A simple, TypeScript-ready Gmail API connector that provides a clean interface for accessing Gmail data with just a few lines of code.

## Features

- 🚀 **Simple API** - Get started with just 10 lines of code
- 🔐 **OAuth 2.0 Authentication** - Secure authentication flow
- 📧 **Email Operations** - Fetch, search, and manage emails
- 🏷️ **Label Management** - Access Gmail labels and categories  
- 📎 **Attachment Support** - Handle email attachments
- 🔍 **Advanced Filtering** - Powerful search and filtering options
- 💪 **TypeScript Support** - Full type definitions included
- ⚡ **Rate Limiting** - Built-in retry logic and error handling

## Installation

```bash
npm install gmail-api-connector
```

## Quick Start

### 1. Setup Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Desktop application)
5. Download the credentials JSON file

### 2. Environment Configuration

Create a `.env` file in your project root:

```env
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/callback
```

### 3. Basic Usage (10 lines!)

```javascript
const { GmailConnector } = require('gmail-api-connector');

const gmail = new GmailConnector({
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: process.env.GMAIL_REDIRECT_URI
});

// Get authorization URL and authenticate
const authUrl = gmail.getAuthUrl();
await gmail.authenticate('authorization_code_from_url');

// Fetch emails
const emails = await gmail.getEmails({ maxResults: 10 });
console.log(`Found ${emails.length} emails`);
```

## API Reference

### Constructor

```typescript
const gmail = new GmailConnector(config: GmailConnectorConfig);
```

**GmailConnectorConfig:**
- `clientId: string` - OAuth 2.0 client ID
- `clientSecret: string` - OAuth 2.0 client secret  
- `redirectUri: string` - Redirect URI for OAuth flow
- `scopes?: string[]` - Optional custom scopes (default: readonly + modify)

### Authentication Methods

#### `getAuthUrl(): string`
Returns the OAuth authorization URL for user consent.

#### `authenticate(code: string): Promise<void>`
Exchanges authorization code for access tokens.

#### `authenticateWithTokens(tokens: AuthTokens): Promise<void>`
Authenticate using previously saved tokens.

#### `getTokens(): AuthTokens | null`
Returns current authentication tokens for storage.

#### `refreshTokens(): Promise<void>`
Refreshes expired access tokens.

#### `revokeAccess(): Promise<void>`
Revokes all tokens and signs out.

### Email Methods

#### `getEmails(filter?: EmailFilter): Promise<ParsedEmail[]>`
Fetches emails with optional filtering.

**EmailFilter options:**
- `maxResults?: number` - Maximum emails to return (default: 10)
- `query?: string` - Gmail search query
- `labelIds?: string[]` - Filter by label IDs
- `includeSpamTrash?: boolean` - Include spam/trash (default: false)

#### `getEmail(messageId: string): Promise<ParsedEmail>`
Fetches a single email by ID.

#### `searchEmails(query: string, maxResults?: number): Promise<ParsedEmail[]>`
Search emails using Gmail query syntax.

#### `getUnreadEmails(maxResults?: number): Promise<ParsedEmail[]>`
Fetches unread emails only.

#### `getEmailsFromSender(senderEmail: string, maxResults?: number): Promise<ParsedEmail[]>`
Fetches emails from specific sender.

#### `getEmailsWithLabel(labelName: string, maxResults?: number): Promise<ParsedEmail[]>`
Fetches emails with specific label.

### Utility Methods

#### `getProfile(): Promise<any>`
Returns user's Gmail profile information.

#### `getLabels(): Promise<any[]>`
Returns all available Gmail labels.

#### `markAsRead(messageId: string): Promise<void>`
Marks an email as read.

#### `markAsUnread(messageId: string): Promise<void>`
Marks an email as unread.

## TypeScript Usage

```typescript
import { GmailConnector, GmailConnectorConfig, ParsedEmail } from 'gmail-api-connector';

const config: GmailConnectorConfig = {
  clientId: process.env.GMAIL_CLIENT_ID!,
  clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/callback'
};

const gmail = new GmailConnector(config);
const emails: ParsedEmail[] = await gmail.getEmails({ maxResults: 5 });
```

## Advanced Examples

### Search with Complex Queries

```javascript
// Find important emails with attachments from last week
const emails = await gmail.searchEmails(
  'has:attachment is:important newer_than:7d', 
  20
);

// Find emails from specific domain
const workEmails = await gmail.searchEmails('from:@company.com', 50);
```

### Handle Attachments

```javascript
const emails = await gmail.getEmails({ maxResults: 5 });

emails.forEach(email => {
  if (email.attachments && email.attachments.length > 0) {
    console.log(`Email "${email.subject}" has attachments:`);
    email.attachments.forEach(attachment => {
      console.log(`- ${attachment.filename} (${attachment.size} bytes)`);
    });
  }
});
```

### Token Management

```javascript
// Save tokens after authentication
await gmail.authenticate(authCode);
const tokens = gmail.getTokens();
// Store tokens securely (database, file, etc.)

// Later, restore from saved tokens
await gmail.authenticateWithTokens(savedTokens);
```

## Error Handling

The connector includes comprehensive error handling:

```javascript
try {
  const emails = await gmail.getEmails();
} catch (error) {
  if (error.message.includes('Authentication')) {
    // Handle auth errors
    console.log('Please re-authenticate');
  } else if (error.message.includes('Rate limit')) {
    // Handle rate limiting
    console.log('Too many requests, please wait');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Gmail Search Query Syntax

You can use Gmail's powerful search syntax in the `query` parameter:

- `is:unread` - Unread emails
- `is:important` - Important emails  
- `has:attachment` - Emails with attachments
- `from:sender@example.com` - From specific sender
- `to:recipient@example.com` - To specific recipient
- `subject:"exact subject"` - Exact subject match
- `newer_than:7d` - Emails newer than 7 days
- `older_than:1m` - Emails older than 1 month
- `label:work` - Emails with "work" label

## Rate Limiting

The connector automatically handles Gmail API rate limits with:
- Exponential backoff retry logic
- Built-in delays between requests
- Graceful error handling for quota exceeded

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Store tokens securely** - Encrypt tokens in production
3. **Use minimal scopes** - Only request necessary permissions
4. **Implement token refresh** - Handle expired tokens gracefully
5. **Validate inputs** - Sanitize user inputs for queries

## Development

```bash
# Clone and install
git clone <repository-url>
cd gmail-api-connector
npm install

# Build TypeScript
npm run build

# Run examples
npm run example:basic
npm run example:advanced
npm run example:typescript

# Run tests
npm test
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

- 📖 [Gmail API Documentation](https://developers.google.com/gmail/api)
- 🔧 [Google Cloud Console](https://console.cloud.google.com/)
- 🐛 [Report Issues](https://github.com/your-repo/issues)