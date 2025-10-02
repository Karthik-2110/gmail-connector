const { GmailConnector } = require('../dist/index');
require('dotenv').config();

async function basicExample() {
  // Initialize the Gmail connector
  const gmail = new GmailConnector({
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/callback'
  });

  try {
    // Step 1: Get authorization URL
    const authUrl = gmail.getAuthUrl();
    console.log('Visit this URL to authorize the application:');
    console.log(authUrl);
    console.log('\nAfter authorization, you will get a code. Use it in the authenticate() method.');
    
    // Step 2: Authenticate (you need to get the code from the auth URL)
    // const authCode = 'your_authorization_code_here';
    // await gmail.authenticate(authCode);

    // Step 3: Fetch emails (uncomment after authentication)
    // const emails = await gmail.getEmails({ maxResults: 5 });
    // console.log(`Found ${emails.length} emails:`);
    // emails.forEach(email => {
    //   console.log(`- ${email.subject} (from: ${email.from})`);
    // });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
basicExample();