const { GmailConnector } = require('../dist/index');
require('dotenv').config();

async function advancedExample() {
  const gmail = new GmailConnector({
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/callback'
  });

  try {
    // If you have saved tokens from previous authentication
    const savedTokens = {
      access_token: 'your_saved_access_token',
      refresh_token: 'your_saved_refresh_token',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
      token_type: 'Bearer',
      expiry_date: 1234567890000
    };

    // Authenticate with saved tokens
    // await gmail.authenticateWithTokens(savedTokens);

    // Get unread emails
    console.log('Fetching unread emails...');
    // const unreadEmails = await gmail.getUnreadEmails(10);
    // console.log(`Found ${unreadEmails.length} unread emails`);

    // Search for specific emails
    console.log('Searching for emails from Gmail team...');
    // const gmailEmails = await gmail.searchEmails('from:gmail-team@google.com', 5);
    // console.log(`Found ${gmailEmails.length} emails from Gmail team`);

    // Get emails from specific sender
    console.log('Getting emails from specific sender...');
    // const senderEmails = await gmail.getEmailsFromSender('noreply@github.com', 3);
    // console.log(`Found ${senderEmails.length} emails from GitHub`);

    // Get user profile
    console.log('Getting user profile...');
    // const profile = await gmail.getProfile();
    // console.log(`Email: ${profile.emailAddress}, Total messages: ${profile.messagesTotal}`);

    // Get labels
    console.log('Getting available labels...');
    // const labels = await gmail.getLabels();
    // console.log('Available labels:', labels.map(label => label.name));

    // Advanced filtering
    console.log('Advanced email filtering...');
    // const filteredEmails = await gmail.getEmails({
    //   maxResults: 20,
    //   query: 'has:attachment is:important',
    //   includeSpamTrash: false
    // });
    // console.log(`Found ${filteredEmails.length} important emails with attachments`);

    // Mark email as read
    // if (unreadEmails.length > 0) {
    //   await gmail.markAsRead(unreadEmails[0].id);
    //   console.log('Marked first unread email as read');
    // }

    // Get current tokens for storage
    // const currentTokens = gmail.getTokens();
    // console.log('Current tokens:', currentTokens);

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error type:', error.constructor.name);
  }
}

// Run the advanced example
advancedExample();