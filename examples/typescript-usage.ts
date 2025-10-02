import { GmailConnector, GmailConnectorConfig, ParsedEmail, EmailFilter } from '../src/index';
import * as dotenv from 'dotenv';

dotenv.config();

async function typescriptExample(): Promise<void> {
  // Type-safe configuration
  const config: GmailConnectorConfig = {
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/callback',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly']
  };

  const gmail = new GmailConnector(config);

  try {
    // Get authorization URL
    const authUrl: string = gmail.getAuthUrl();
    console.log('Authorization URL:', authUrl);

    // Example with proper error handling and typing
    // const authCode = 'your_authorization_code_here';
    // await gmail.authenticate(authCode);

    // Type-safe email filtering
    const filter: EmailFilter = {
      maxResults: 10,
      query: 'is:unread',
      includeSpamTrash: false
    };

    // const emails: ParsedEmail[] = await gmail.getEmails(filter);
    // 
    // emails.forEach((email: ParsedEmail) => {
    //   console.log(`Subject: ${email.subject}`);
    //   console.log(`From: ${email.from}`);
    //   console.log(`Date: ${email.date}`);
    //   console.log(`Snippet: ${email.snippet}`);
    //   
    //   if (email.attachments && email.attachments.length > 0) {
    //     console.log(`Attachments: ${email.attachments.map(att => att.filename).join(', ')}`);
    //   }
    //   
    //   console.log('---');
    // });

    // Type-safe profile access
    // const profile = await gmail.getProfile();
    // console.log(`User: ${profile.emailAddress}`);
    // console.log(`Total messages: ${profile.messagesTotal}`);
    // console.log(`Threads total: ${profile.threadsTotal}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// Run the TypeScript example
typescriptExample().catch(console.error);