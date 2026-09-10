import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

// Memory cache for the Gmail OAuth token
let cachedGmailToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('gmail_access_token') : null;

export function getCachedGmailToken(): string | null {
  if (!cachedGmailToken && typeof window !== 'undefined') {
    cachedGmailToken = localStorage.getItem('gmail_access_token');
  }
  return cachedGmailToken;
}

export function setCachedGmailToken(token: string | null) {
  cachedGmailToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('gmail_access_token', token);
    } else {
      localStorage.removeItem('gmail_access_token');
    }
  }
}

/**
 * Initiates Gmail connection by signing in/linking via Google Auth Popup
 */
export async function connectGmailAccount(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google.');
    }
    cachedGmailToken = credential.accessToken;
    setCachedGmailToken(cachedGmailToken);
    return cachedGmailToken;
  } catch (error: any) {
    const errStr = String(error?.code || error?.message || error || '');
    if (
      errStr.includes('popup-blocked') ||
      errStr.includes('cancelled-popup-request') ||
      errStr.includes('popup-closed-by-user') ||
      errStr.includes('popup_closed')
    ) {
      console.warn('Popup blocked or closed by user, attempting signInWithRedirect...');
      try {
        await signInWithRedirect(auth, provider);
      } catch (rErr) {
        console.warn('Redirect fallback notice:', rErr);
      }
      return '';
    }
    console.error('Error connecting Google Gmail:', error);
    throw error;
  }
}

/**
 * Header helper to grab values by name
 */
function getHeader(headers: any[], name: string): string {
  const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

/**
 * Decodes base64url strings from Google API
 */
function decodeBase64(str: string): string {
  if (!str) return '';
  // Convert from url-safe base64 to standard base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    try {
      return atob(base64);
    } catch (_) {
      return 'Message content could not be decoded.';
    }
  }
}

/**
 * Recursively parses body segments in multipart mail messages
 */
function getMessageBody(payload: any): string {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    // Try plain text parts first
    const txtPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (txtPart && txtPart.body && txtPart.body.data) {
      return decodeBase64(txtPart.body.data);
    }
    // Then html/other parts
    for (const part of payload.parts) {
      const content = getMessageBody(part);
      if (content) return content;
    }
  }
  return '';
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  messageId?: string;
}

/**
 * Fetches top Gmail inbox messages
 */
export async function fetchGmailInbox(accessToken: string, maxResults = 15): Promise<GmailMessage[]> {
  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=category:primary`;
    const response = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        cachedGmailToken = null; // Clear if expired
        throw new Error('Session expired or access unauthorized. Please reconnect your Gmail.');
      }
      throw new Error(`Gmail API failure: ${response.statusText}`);
    }

    const listData = await response.json();
    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // Load message details in parallel
    const detailPromises = listData.messages.map(async (msgSummary: { id: string }) => {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSummary.id}`;
      const detailRes = await fetch(detailUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!detailRes.ok) return null;
      return detailRes.json();
    });

    const details = await Promise.all(detailPromises);
    const parsedMessages: GmailMessage[] = details
      .filter(d => d !== null)
      .map(d => {
        const headers = d.payload?.headers || [];
        const subject = getHeader(headers, 'subject') || '(No Subject)';
        const from = getHeader(headers, 'from') || '(Unknown Sender)';
        const to = getHeader(headers, 'to') || '';
        const date = getHeader(headers, 'date') || '';
        const snippet = d.snippet || '';
        const messageId = getHeader(headers, 'message-id') || '';
        let body = getMessageBody(d.payload) || snippet;
        
        // Basic cleanups for nested styling tags or html residues
        if (body.includes('<div') || body.includes('<p') || body.includes('<html')) {
          // If HTML text, strip tags only roughly if needed, otherwise rely on iframe or simple formatting
          // Just a light sanitization/stripping for readability in simple rendering
          body = body.replace(/<\/?[^>]+(>|$)/g, "");
        }

        return {
          id: d.id,
          threadId: d.threadId,
          subject,
          from,
          to,
          date,
          snippet,
          body: body.trim(),
          messageId
        };
      });

    return parsedMessages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

/**
 * Sends a Gmail email using Raw MIME format
 */
export async function sendGmailEmail(accessToken: string, to: string, subject: string, body: string, threadId?: string, messageId?: string): Promise<any> {
  try {
    const emailHeaderLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
    ];

    if (messageId) {
      emailHeaderLines.push(`In-Reply-To: ${messageId}`);
      emailHeaderLines.push(`References: ${messageId}`);
    }

    const emailContent = [
      ...emailHeaderLines,
      '',
      body
    ].join('\r\n');

    // Safe base64url encoding for UTF-8 and unicode content
    const base64Raw = btoa(
      encodeURIComponent(emailContent).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: base64Raw,
        threadId: threadId || undefined
      })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errMsg = errorJson?.error?.message || response.statusText;
      throw new Error(`Gmail API sending failure: ${errMsg}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Google mail:', error);
    throw error;
  }
}
