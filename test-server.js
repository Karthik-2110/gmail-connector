const express = require('express');
const { GmailConnector } = require('./dist/index');
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize Gmail connector
const gmail = new GmailConnector({
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: `http://localhost:${port}/callback`
});

// Serve basic HTML for testing
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Gmail Connector Test</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
        <h1>Gmail API Connector Test</h1>
        <p>Click the button below to start the OAuth authentication flow:</p>
        <a href="/auth" style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
          🔐 Authenticate with Gmail
        </a>
        <h3>Instructions:</h3>
        <ol>
          <li>Make sure you've configured your .env file with Google credentials</li>
          <li>Click "Authenticate with Gmail" above</li>
          <li>Grant permissions in the Google OAuth flow</li>
          <li>You'll be redirected back here with test results</li>
        </ol>
        <p><strong>Note:</strong> Make sure your Google Cloud Console has the redirect URI: <code>http://localhost:3000/callback</code></p>
      </body>
    </html>
  `);
});

// Start OAuth flow
app.get('/auth', (req, res) => {
  try {
    const authUrl = gmail.getAuthUrl();
    console.log('🔗 Redirecting to OAuth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Error generating auth URL:', error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Handle OAuth callback and test functionality
app.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (!code) {
      throw new Error('No authorization code received');
    }

    console.log('🔑 Authenticating with code...');
    await gmail.authenticate(code);
    console.log('✅ Authentication successful!');

    // Test basic functionality
    console.log('📧 Testing email fetching...');
    const emails = await gmail.getEmails({ maxResults: 5 });
    
    console.log('👤 Testing profile access...');
    const profile = await gmail.getProfile();
    
    console.log('🏷️ Testing labels access...');
    const labels = await gmail.getLabels();
    
    console.log('📬 Testing unread emails...');
    const unreadEmails = await gmail.getUnreadEmails(3);

    // Get current tokens for display
    const tokens = gmail.getTokens();
    
    res.send(`
      <html>
        <head><title>Gmail Connector - Test Results</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
          <h1>✅ Gmail API Connector Test Results</h1>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #155724;">🎉 Authentication Successful!</h3>
            <p>Your Gmail API connector is working correctly.</p>
          </div>

          <h3>📊 Test Results:</h3>
          <ul>
            <li><strong>Profile:</strong> ${profile.emailAddress} (${profile.messagesTotal} total messages)</li>
            <li><strong>Recent Emails:</strong> ${emails.length} emails fetched</li>
            <li><strong>Unread Emails:</strong> ${unreadEmails.length} unread emails</li>
            <li><strong>Labels:</strong> ${labels.length} labels available</li>
            <li><strong>Token Expiry:</strong> ${new Date(tokens.expiry_date).toLocaleString()}</li>
          </ul>

          <h3>📧 Recent Emails:</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px;">
            ${emails.map(email => `
              <div style="border-bottom: 1px solid #dee2e6; padding: 10px 0;">
                <strong>${email.subject || '(No Subject)'}</strong><br>
                <small>From: ${email.from} | Date: ${email.date}</small><br>
                <em>${email.snippet}</em>
              </div>
            `).join('')}
          </div>

          <h3>🏷️ Available Labels:</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px;">
            ${labels.slice(0, 10).map(label => `<span style="background: #e9ecef; padding: 2px 8px; margin: 2px; border-radius: 12px; font-size: 12px;">${label.name}</span>`).join(' ')}
            ${labels.length > 10 ? `<span style="color: #6c757d;">... and ${labels.length - 10} more</span>` : ''}
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
            <h4 style="margin-top: 0;">🔧 Next Steps:</h4>
            <ol>
              <li>Save your tokens securely for future use</li>
              <li>Try the example files in the <code>examples/</code> directory</li>
              <li>Integrate the connector into your application</li>
              <li>Check the README.md for full API documentation</li>
            </ol>
          </div>

          <p style="margin-top: 30px;">
            <a href="/" style="display: inline-block; background: #6c757d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
              ← Back to Start
            </a>
          </p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    res.status(500).send(`
      <html>
        <head><title>Gmail Connector - Test Error</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
          <h1>❌ Test Failed</h1>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #721c24;">Error Details:</h3>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Type:</strong> ${error.constructor.name}</p>
          </div>
          
          <h3>🔧 Troubleshooting:</h3>
          <ul>
            <li>Check your .env file has correct Google credentials</li>
            <li>Verify Gmail API is enabled in Google Cloud Console</li>
            <li>Ensure redirect URI matches: http://localhost:3000/callback</li>
            <li>Check the console logs for more details</li>
          </ul>
          
          <p>
            <a href="/" style="display: inline-block; background: #6c757d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
              ← Try Again
            </a>
          </p>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Gmail Connector Test Server running at http://localhost:${port}`);
  console.log(`📖 Visit http://localhost:${port} to start testing`);
  console.log(`🔧 Make sure your .env file is configured with Google credentials`);
});