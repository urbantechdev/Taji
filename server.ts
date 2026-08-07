import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Helper to get OAuth2 Client
function getOAuth2Client(req: express.Request) {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  // Determine redirect URL dynamically
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Helper to get authenticated Gmail client from cookies
function getAuthenticatedGmailClient(req: express.Request) {
  const tokenCookie = req.cookies.gmail_tokens;
  if (!tokenCookie) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    return { gmail, oauth2Client };
  } catch (err) {
    console.error('Error parsing token cookie:', err);
    return null;
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Auth Status
app.get('/api/auth/status', async (req, res) => {
  const auth = getAuthenticatedGmailClient(req);
  if (!auth) {
    return res.json({ authenticated: false });
  }

  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: auth.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    return res.json({
      authenticated: true,
      user: {
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
      },
    });
  } catch (err: any) {
    console.error('Error fetching user info:', err.message);
    return res.json({ authenticated: false, error: 'Session expired or invalid' });
  }
});

// 2. Initiate Google Auth
app.get('/api/auth/google', (req, res) => {
  const oauth2Client = getOAuth2Client(req);
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  res.redirect(authUrl);
});

// 3. Google Auth Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in cookie
    res.cookie('gmail_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600 * 1000, // 30 days
    });

    // Send postMessage to close popup or redirect back to app
    res.send(`
      <!語html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f8fafc;">
          <h2 style="color: #16a34a;">Connected to Google!</h2>
          <p>Redirecting back to platform...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Error exchanging OAuth code:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// 4. Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('gmail_tokens');
  res.json({ success: true });
});

// 5. List Gmail Messages
app.get('/api/gmail/messages', async (req, res) => {
  const auth = getAuthenticatedGmailClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const { gmail } = auth;
    const query = (req.query.q as string) || 'in:inbox';
    const maxResults = parseInt((req.query.maxResults as string) || '15', 10);

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    const messages = listRes.data.messages || [];

    // Fetch full details for each message
    const detailedMessages = await Promise.all(
      messages.map(async (m) => {
        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: m.id!,
            format: 'full',
          });

          const headers = detail.data.payload?.headers || [];
          const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
          const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';
          const isUnread = detail.data.labelIds?.includes('UNREAD') || false;

          return {
            id: detail.data.id,
            threadId: detail.data.threadId,
            snippet: detail.data.snippet,
            subject,
            from,
            date,
            isUnread,
            labelIds: detail.data.labelIds || [],
          };
        } catch (e) {
          return null;
        }
      })
    );

    const validMessages = detailedMessages.filter(Boolean);
    res.json({ messages: validMessages });
  } catch (err: any) {
    console.error('Error fetching Gmail messages:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch emails' });
  }
});

// 6. Get Single Gmail Message Detail
app.get('/api/gmail/messages/:id', async (req, res) => {
  const auth = getAuthenticatedGmailClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { gmail } = auth;
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: req.params.id,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
    const to = headers.find((h) => h.name?.toLowerCase() === 'to')?.value || '';
    const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';

    // Extract body snippet or HTML/text
    let bodyText = '';
    const payload = detail.data.payload;

    if (payload?.body?.data) {
      bodyText = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload?.parts) {
      const textPart = payload.parts.find((p) => p.mimeType === 'text/html') || payload.parts.find((p) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    if (!bodyText) {
      bodyText = detail.data.snippet || '';
    }

    res.json({
      id: detail.data.id,
      threadId: detail.data.threadId,
      subject,
      from,
      to,
      date,
      body: bodyText,
      snippet: detail.data.snippet,
      labelIds: detail.data.labelIds,
    });
  } catch (err: any) {
    console.error('Error fetching message detail:', err);
    res.status(500).json({ error: 'Failed to fetch email detail' });
  }
});

// 7. Send Email
app.post('/api/gmail/send', async (req, res) => {
  const auth = getAuthenticatedGmailClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'To, subject, and message are required' });
  }

  try {
    const { gmail } = auth;
    // Construct raw RFC 2822 email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      message.replace(/\n/g, '<br/>'),
    ];
    const rawEmail = messageParts.join('\n');
    const encodedMessage = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendRes = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    res.json({ success: true, id: sendRes.data.id });
  } catch (err: any) {
    console.error('Error sending email:', err.message);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

// 8. Trash Email
app.post('/api/gmail/trash/:id', async (req, res) => {
  const auth = getAuthenticatedGmailClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { gmail } = auth;
    await gmail.users.messages.trash({
      userId: 'me',
      id: req.params.id,
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error trashing email:', err);
    res.status(500).json({ error: 'Failed to trash email' });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
