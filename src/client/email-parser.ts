import { EmailMessage, ParsedEmail, EmailAttachment, EmailPart } from '../types';
import { decodeBase64Url, getHeaderValue, parseEmailAddresses, formatGmailDate } from '../utils/helpers';

export class EmailParser {
  /**
   * Parse Gmail API message to readable format
   */
  static parseMessage(message: EmailMessage): ParsedEmail {
    const headers = message.payload.headers;
    
    const subject = getHeaderValue(headers, 'Subject');
    const from = getHeaderValue(headers, 'From');
    const to = parseEmailAddresses(getHeaderValue(headers, 'To'));
    const cc = parseEmailAddresses(getHeaderValue(headers, 'Cc'));
    const bcc = parseEmailAddresses(getHeaderValue(headers, 'Bcc'));
    const date = formatGmailDate(message.internalDate);

    const body = this.extractBody(message.payload);
    const attachments = this.extractAttachments(message.payload);

    return {
      id: message.id,
      threadId: message.threadId,
      subject,
      from,
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      date,
      snippet: message.snippet,
      body,
      attachments: attachments.length > 0 ? attachments : undefined
    };
  }

  /**
   * Extract email body (text and HTML)
   */
  private static extractBody(payload: EmailMessage['payload']): { text?: string; html?: string } {
    const body: { text?: string; html?: string } = {};

    // Check if body is directly in payload
    if (payload.body?.data) {
      const mimeType = payload.mimeType || '';
      const decodedBody = decodeBase64Url(payload.body.data);
      
      if (mimeType.includes('text/plain')) {
        body.text = decodedBody;
      } else if (mimeType.includes('text/html')) {
        body.html = decodedBody;
      }
    }

    // Check parts for multipart messages
    if (payload.parts) {
      this.extractBodyFromParts(payload.parts, body);
    }

    return body;
  }

  /**
   * Recursively extract body from message parts
   */
  private static extractBodyFromParts(parts: EmailPart[], body: { text?: string; html?: string }): void {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body.text = decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        body.html = decodeBase64Url(part.body.data);
      } else if (part.parts) {
        // Recursive call for nested parts
        this.extractBodyFromParts(part.parts, body);
      }
    }
  }

  /**
   * Extract attachments from message
   */
  private static extractAttachments(payload: EmailMessage['payload']): EmailAttachment[] {
    const attachments: EmailAttachment[] = [];

    if (payload.parts) {
      this.extractAttachmentsFromParts(payload.parts, attachments);
    }

    return attachments;
  }

  /**
   * Recursively extract attachments from message parts
   */
  private static extractAttachmentsFromParts(parts: EmailPart[], attachments: EmailAttachment[]): void {
    for (const part of parts) {
      if (part.filename && part.body?.size && part.body.size > 0) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.data || part.partId
        });
      }

      if (part.parts) {
        this.extractAttachmentsFromParts(part.parts, attachments);
      }
    }
  }

  /**
   * Parse multiple messages
   */
  static parseMessages(messages: EmailMessage[]): ParsedEmail[] {
    return messages.map(message => this.parseMessage(message));
  }

  /**
   * Extract plain text from HTML content
   */
  static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }
}