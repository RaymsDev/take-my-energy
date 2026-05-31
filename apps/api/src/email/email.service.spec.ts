import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

const mockEmailsSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const cfg: Record<string, string> = {
        RESEND_API_KEY: 'test-key',
        EMAIL_FROM: 'noreply@takemyenergy.fr',
      };
      return cfg[key];
    }),
  };

  beforeEach(async () => {
    mockEmailsSend.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<EmailService>(EmailService);
  });

  const baseParams = {
    to: 'alice@example.com',
    recipientName: 'Alice',
    senderName: 'Bob',
    serviceName: 'Swedish Massage 60min',
    price: 80,
    currency: 'EUR',
    code: 'GIFT-ABC123',
  };

  it('calls resend with correct to, from, subject, and html containing service name and code', async () => {
    mockEmailsSend.mockResolvedValueOnce({ data: { id: '1' }, error: null });
    await service.sendGiftCard(baseParams);
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.to).toBe('alice@example.com');
    expect(call.from).toBe('noreply@takemyenergy.fr');
    expect(call.subject).toBe('Your gift card from Take My Energy');
    expect(call.html).toContain('Swedish Massage 60min');
    expect(call.html).toContain('GIFT-ABC123');
  });

  it('includes the personal message in HTML when message is provided', async () => {
    mockEmailsSend.mockResolvedValueOnce({ data: { id: '2' }, error: null });
    await service.sendGiftCard({
      ...baseParams,
      message: 'Enjoy your session!',
    });
    expect(mockEmailsSend.mock.calls[0][0].html).toContain(
      'Enjoy your session!',
    );
  });

  it('renders cleanly without undefined or empty paragraph when message is absent', async () => {
    mockEmailsSend.mockResolvedValueOnce({ data: { id: '3' }, error: null });
    await service.sendGiftCard(baseParams);
    const html: string = mockEmailsSend.mock.calls[0][0].html;
    expect(html).not.toContain('undefined');
    expect(html).not.toMatch(/<p[^>]*>\s*<\/p>/);
  });

  it('throws when Resend returns an error object', async () => {
    const resendError = { message: 'Bad API key', statusCode: 401 };
    mockEmailsSend.mockResolvedValueOnce({ data: null, error: resendError });
    await expect(service.sendGiftCard(baseParams)).rejects.toEqual(resendError);
  });
});
