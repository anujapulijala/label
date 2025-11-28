declare module 'nodemailer' {
  export type Attachment = {
    filename?: string;
    path?: string;
    contentType?: string;
  };
  export type MailOptions = {
    from?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Attachment[];
  };
  export interface Transporter {
    sendMail(options: MailOptions): Promise<any>;
  }
  export function createTransport(options: any): Transporter;
  const nodemailer: {
    createTransport: typeof createTransport;
  };
  export default nodemailer;
}


