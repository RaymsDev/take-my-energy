import { Test, TestingModule } from '@nestjs/testing';

const mockToBuffer = jest.fn();

// Virtual mocks allow these tests to run before pdfkit/qrcode are installed
jest.mock(
  'qrcode',
  () => ({
    __esModule: true,
    default: { toBuffer: (...args: unknown[]) => mockToBuffer(...args) },
  }),
  { virtual: true },
);
jest.mock(
  'pdfkit',
  () => {
    const MockPDF = jest.fn().mockImplementation(function (this: {
      pipe: jest.Mock;
      on: jest.Mock;
      fontSize: jest.Mock;
      fillColor: jest.Mock;
      font: jest.Mock;
      text: jest.Mock;
      moveDown: jest.Mock;
      image: jest.Mock;
      end: jest.Mock;
      page: { width: number; height: number };
      y: number;
      _dest: NodeJS.WritableStream | null;
    }) {
      this._dest = null;
      this.pipe = jest
        .fn()
        .mockImplementation((dest: NodeJS.WritableStream) => {
          this._dest = dest;
          return dest;
        });
      this.on = jest.fn().mockReturnThis();
      this.fontSize = jest.fn().mockReturnThis();
      this.fillColor = jest.fn().mockReturnThis();
      this.font = jest.fn().mockReturnThis();
      this.text = jest.fn().mockReturnThis();
      this.moveDown = jest.fn().mockReturnThis();
      this.image = jest.fn().mockReturnThis();
      this.page = { width: 420, height: 595 };
      this.y = 100;
      this.end = jest.fn().mockImplementation(() => {
        if (this._dest) (this._dest as import('stream').PassThrough).end();
      });
    });
    return { __esModule: true, default: MockPDF };
  },
  { virtual: true },
);

import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    mockToBuffer.mockReset();
    mockToBuffer.mockResolvedValue(Buffer.from('fake-png'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  const validParams = {
    serviceName: 'Massage Holistique',
    recipientName: 'Marie',
    senderName: 'Jean',
    code: 'ABC-123',
    qrUrl: 'https://cinqdecoeur.fr/cadeau/service/2',
  };

  it('resolves to a Buffer', async () => {
    const buffer = await service.generateGiftCardPdf(validParams);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('calls QRCode.toBuffer with the provided qrUrl and png type', async () => {
    await service.generateGiftCardPdf(validParams);
    expect(mockToBuffer).toHaveBeenCalledWith(validParams.qrUrl, {
      type: 'png',
      width: 150,
    });
  });

  it('propagates QRCode.toBuffer rejection', async () => {
    mockToBuffer.mockRejectedValueOnce(new Error('qr error'));
    await expect(service.generateGiftCardPdf(validParams)).rejects.toThrow(
      'qr error',
    );
  });
});
