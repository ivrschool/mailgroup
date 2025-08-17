import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
  (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/callback` : "http://localhost:5000/api/auth/callback");

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || "default_client_id",
  process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || "default_client_secret",
  redirectUri
);

export interface GmailEmail {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  timestamp: Date;
  rawData: any;
}

export class GmailService {
  private gmail: any;

  constructor(accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  static getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  static async getTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  static async getUserInfo(accessToken: string) {
    try {
      // Use direct HTTP request to avoid OAuth client issues
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  async getRecentEmails(maxResults: number = 200): Promise<GmailEmail[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox',
      });

      const messages = response.data.messages || [];
      const emails: GmailEmail[] = [];

      for (const message of messages) {
        try {
          const emailData = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const headers = emailData.data.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name === 'Date')?.value;

          emails.push({
            id: message.id,
            subject,
            sender: from,
            snippet: emailData.data.snippet || '',
            timestamp: date ? new Date(date) : new Date(),
            rawData: emailData.data,
          });
        } catch (error) {
          console.error(`Error fetching email ${message.id}:`, error);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  async archiveEmails(emailIds: string[]): Promise<void> {
    try {
      await this.gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: emailIds,
          removeLabelIds: ['INBOX'],
        },
      });
    } catch (error) {
      console.error('Error archiving emails:', error);
      throw new Error('Failed to archive emails');
    }
  }
}
