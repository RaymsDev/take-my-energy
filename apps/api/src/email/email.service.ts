import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EMAIL_TIMEOUT_MS = 10_000;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resendClient: Resend | null = null;

  constructor(private readonly config: ConfigService) {
    if (!this.config.get<string>('RESEND_API_KEY')) {
      this.logger.warn('RESEND_API_KEY is not set — emails will not be sent');
    }
  }

  private getClient(): Resend {
    if (!this.resendClient) {
      const key = this.config.get<string>('RESEND_API_KEY');
      if (!key) {
        this.logger.error('RESEND_API_KEY is not configured');
        throw new Error('RESEND_API_KEY is not configured');
      }
      this.resendClient = new Resend(key);
    }
    return this.resendClient;
  }

  async sendGiftCard(params: {
    to: string;
    recipientName: string;
    senderName: string;
    serviceName: string;
    code: string;
    message?: string;
  }): Promise<void> {
    const { to, recipientName, senderName, serviceName, code, message } =
      params;

    const safeRecipientName = escHtml(recipientName);
    const safeSenderName = escHtml(senderName);
    const safeServiceName = escHtml(serviceName);

    const messageBlock = message
      ? `<div style="margin: 24px 0; padding: 16px; background: #f9f9f9; border-left: 4px solid #4f46e5; border-radius: 4px;">
        <p style="margin: 0; font-style: italic; color: #374151;">"${escHtml(message)}"</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">— ${safeSenderName}</p>
      </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre carte cadeau Take My Energy</title>
</head>
<body style="font-family: sans-serif; background: #f3f4f6; margin: 0; padding: 32px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #4f46e5; padding: 32px 40px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Vous avez reçu une carte cadeau !</h1>
    </div>
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 16px;">Bonjour <strong>${safeRecipientName}</strong>,</p>
      <p style="color: #374151; font-size: 16px;">
        <strong>${safeSenderName}</strong> vous offre une carte cadeau pour <strong>${safeServiceName}</strong>.
      </p>

      <div style="margin: 24px 0; padding: 20px; background: #eef2ff; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em;">Prestation</p>
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1e1b4b;">${safeServiceName}</p>
      </div>

      ${messageBlock}

      <p style="color: #374151; font-size: 16px; margin-top: 32px;">Utilisez le code ci-dessous pour profiter de votre carte cadeau :</p>

      <div style="margin: 16px 0; padding: 20px; background: #1e1b4b; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.1em;">Code cadeau</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 0.15em; font-family: monospace;">${code}</p>
      </div>

      <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
        Cette carte cadeau vous a été envoyée via <a href="https://cinqdecoeur.fr/" style="color: #4f46e5; text-decoration: none;"><strong>Cinq de Cœur</strong></a>. Pour toute question, n'hésitez pas à nous contacter.
      </p>
    </div>
  </div>
</body>
</html>`;

    const client = this.getClient();

    this.logger.log(
      `Sending gift card email to ${to} (service: ${serviceName})`,
    );

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Resend API timeout')),
        EMAIL_TIMEOUT_MS,
      );
    });

    try {
      const { data, error } = await Promise.race([
        client.emails.send({
          from: this.config.get<string>('EMAIL_FROM') as string,
          to,
          subject: 'Votre carte cadeau Cinq de Cœur',
          html,
        }),
        timeout,
      ]);

      if (error) {
        this.logger.error(
          `Failed to send gift card email to ${to}: ${error.message}`,
        );
        throw error;
      }

      this.logger.log(`Gift card email sent to ${to} (id: ${data?.id})`);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}
