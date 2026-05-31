import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  private get resendClient(): Resend {
    return new Resend(this.config.get('RESEND_API_KEY'));
  }

  async sendGiftCard(params: {
    to: string;
    recipientName: string;
    senderName: string;
    serviceName: string;
    price: number;
    currency: string;
    code: string;
    message?: string;
  }): Promise<void> {
    const {
      to,
      recipientName,
      senderName,
      serviceName,
      price,
      currency,
      code,
      message,
    } = params;

    const messageBlock =
      message
        ? `<div style="margin: 24px 0; padding: 16px; background: #f9f9f9; border-left: 4px solid #4f46e5; border-radius: 4px;">
        <p style="margin: 0; font-style: italic; color: #374151;">"${message}"</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">— ${senderName}</p>
      </div>`
        : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Gift Card from Take My Energy</title>
</head>
<body style="font-family: sans-serif; background: #f3f4f6; margin: 0; padding: 32px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #4f46e5; padding: 32px 40px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">You received a gift card!</h1>
    </div>
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
      <p style="color: #374151; font-size: 16px;">
        <strong>${senderName}</strong> has sent you a gift card for <strong>${serviceName}</strong>.
      </p>

      <div style="margin: 24px 0; padding: 20px; background: #eef2ff; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em;">Service</p>
        <p style="margin: 0 0 4px; font-size: 20px; font-weight: bold; color: #1e1b4b;">${serviceName}</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: #4f46e5;">${price} ${currency}</p>
      </div>

      ${messageBlock}

      <p style="color: #374151; font-size: 16px; margin-top: 32px;">Use the code below to redeem your gift card:</p>

      <div style="margin: 16px 0; padding: 20px; background: #1e1b4b; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.1em;">Redemption Code</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 0.15em; font-family: monospace;">${code}</p>
      </div>

      <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
        This gift card was sent via <strong>Take My Energy</strong>. If you have any questions, please contact us.
      </p>
    </div>
  </div>
</body>
</html>`;

    const { error } = await this.resendClient.emails.send({
      from: this.config.get<string>('EMAIL_FROM') as string,
      to,
      subject: 'Your gift card from Take My Energy',
      html,
    });

    if (error) {
      throw error;
    }
  }
}
