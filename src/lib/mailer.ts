import fs from 'fs';

type MailAttachment = { filename: string; path: string; contentType?: string };

type Transporter = any;
let cachedTransport: Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  // lazy-require nodemailer only when SMTP is configured (avoids bundler resolution when not installed)
  const req: any = (eval('require') as any);
  const { createTransport } = req('nodemailer');
  cachedTransport = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  return cachedTransport;
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}) {
  const transport = getTransport();
  if (!transport) {
    // silently skip when SMTP not configured
    return { ok: false, skipped: true };
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: (opts.attachments || [])
      .filter(a => a && a.path && fs.existsSync(a.path))
      .map(a => ({ filename: a.filename, path: a.path, contentType: a.contentType }))
  });
  return { ok: true };
}


