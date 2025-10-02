# Testing Guide for Gmail API Connector

## Prerequisites

### 1. Google Cloud Setup
1. **Create Google Cloud Project**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Enable Gmail API in "APIs & Services" → "Library"

2. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Create "OAuth 2.0 Client IDs" for "Desktop application"
   - Add redirect URI: `http://localhost:3000/callback`
   - Download credentials JSON

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

## Testing Methods

### Method 1: Quick Integration Test

1. **Setup Environment**
   ```bash
   # Copy and configure environment
   cp .env.example .env
   
   # Edit .env file with your Google credentials
   GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your_client_secret_here
   GMAIL_REDIRECT_URI=http://localhost:3000/callback
   ```

2. **Run Basic Example**
   ```bash
   # Build the project first
   npm run build
   
   # Run basic example
   cd examples
   npm install
   node basic-usage.js
   ```

### Method 2: Interactive Testing Server

Create a simple test server for easier OAuth flow:

```javascript
// test-server.js
const express = require('express');
const { GmailConnector } = require('./dist/index');
require('dotenv').config();

const app = express();
const port = 3000;

const gmail = new GmailConnector({
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: `http://localhost:${port}/callback`
});

// Start OAuth flow
app.get('/auth', (req, res) => {
  const authUrl = gmail.getAuthUrl();
  res.redirect(authUrl);
});

// Handle OAuth callback
app.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    await gmail.authenticate(code);
    
    // Test fetching emails
    const emails = await gmail.getEmails({ maxResults: 5 });
    
    res.json({
      success: true,
      message: `Successfully authenticated! Found ${emails.length} emails.`,
      emails: emails.map(email => ({
        subject: email.subject,
        from: email.from,
        date: email.date
      }))
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log(`Visit http://localhost:${port}/auth to start OAuth flow`);
});
```

### Method 3: Unit Testing

Run the included Jest tests:

```bash
# Install test dependencies
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Method 4: Manual API Testing

Test individual components:

```javascript
// manual-test.js
const { GmailConnector } = require('./dist/index');

async function testConnector() {
  const gmail = new GmailConnector({
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI
  });

  // Test 1: Generate auth URL
  console.log('Auth URL:', gmail.getAuthUrl());

  // Test 2: Authenticate (you need to get code from auth URL)
  // const code = 'your_auth_code_here';
  // await gmail.authenticate(code);

  // Test 3: Fetch emails
  // const emails = await gmail.getEmails({ maxResults: 3 });
  // console.log('Emails:', emails);

  // Test 4: Search emails
  // const unread = await gmail.getUnreadEmails(5);
  // console.log('Unread emails:', unread.length);
}

testConnector().catch(console.error);
```

## Testing Checklist

### ✅ Basic Functionality
- [ ] OAuth URL generation
- [ ] Authentication flow
- [ ] Token storage and retrieval
- [ ] Email fetching
- [ ] Email searching
- [ ] Error handling

### ✅ Advanced Features
- [ ] Unread email filtering
- [ ] Sender-based filtering
- [ ] Label-based filtering
- [ ] Attachment handling
- [ ] Email parsing (HTML/text)
- [ ] Rate limiting
- [ ] Token refresh

### ✅ Error Scenarios
- [ ] Invalid credentials
- [ ] Expired tokens
- [ ] Network errors
- [ ] API rate limits
- [ ] Invalid email IDs
- [ ] Permission errors

## Common Issues & Solutions

### Issue: "Invalid client_id"
**Solution:** Check your `.env` file has correct `GMAIL_CLIENT_ID`

### Issue: "Redirect URI mismatch"
**Solution:** Ensure redirect URI in Google Cloud Console matches your `.env` file

### Issue: "Access denied"
**Solution:** Make sure Gmail API is enabled in Google Cloud Console

### Issue: "Token expired"
**Solution:** The connector automatically refreshes tokens, but check your refresh token is valid

### Issue: "Rate limit exceeded"
**Solution:** The connector has built-in retry logic, but you may need to wait

## Performance Testing

Test with different email volumes:

```javascript
// Test with various email counts
const testCases = [
  { maxResults: 1, description: 'Single email' },
  { maxResults: 10, description: 'Small batch' },
  { maxResults: 50, description: 'Medium batch' },
  { maxResults: 100, description: 'Large batch' }
];

for (const testCase of testCases) {
  console.time(testCase.description);
  const emails = await gmail.getEmails({ maxResults: testCase.maxResults });
  console.timeEnd(testCase.description);
  console.log(`${testCase.description}: ${emails.length} emails fetched`);
}
```

## Security Testing

Verify security measures:

```javascript
// Test token handling
const tokens = gmail.getTokens();
console.log('Tokens stored securely:', !!tokens);

// Test scope limitations
try {
  // This should work with readonly scope
  const emails = await gmail.getEmails();
  console.log('Read access: ✓');
  
  // This requires modify scope
  await gmail.markAsRead(emails[0].id);
  console.log('Modify access: ✓');
} catch (error) {
  console.log('Scope limitation detected:', error.message);
}
```

## Debugging Tips

1. **Enable verbose logging:**
   ```javascript
   process.env.DEBUG = 'gmail-connector:*';
   ```

2. **Check API quotas:**
   - Visit Google Cloud Console → APIs & Services → Quotas
   - Monitor your Gmail API usage

3. **Validate tokens:**
   ```javascript
   const tokens = gmail.getTokens();
   console.log('Token expiry:', new Date(tokens.expiry_date));
   ```

4. **Test with different Gmail accounts:**
   - Personal Gmail
   - G Suite/Workspace account
   - Account with different label structures