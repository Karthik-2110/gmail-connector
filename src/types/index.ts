export interface GmailConnectorConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

export interface EmailFilter {
  maxResults?: number;
  query?: string;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    mimeType?: string;
    headers: EmailHeader[];
    body?: {
      data?: string;
      size: number;
    };
    parts?: EmailPart[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailPart {
  partId: string;
  mimeType: string;
  filename?: string;
  headers: EmailHeader[];
  body?: {
    data?: string;
    size: number;
  };
  parts?: EmailPart[];
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: Date;
  snippet: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}