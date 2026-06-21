import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import QRCode from 'qrcode';

jest.mock('qrcode');

const mockQrBuffer = Buffer.from('fake-png');
const mockedQRCode = jest.mocked(QRCode);

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
    (mockedQRCode.toBuffer as jest.Mock).mockResolvedValue(mockQrBuffer);
  });

  afterEach(() => jest.clearAllMocks());

  const validParams = {
    serviceName: 'Massage Holistique',
    recipientName: 'Marie',
    senderName: 'Jean',
    code: 'ABC-123',
    qrUrl: 'https://cinqdecoeur.fr/cadeau/service/2',
  };

  it('resolves to a non-empty Buffer', async () => {
    const buffer = await service.generateGiftCardPdf(validParams);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('starts with the PDF magic bytes %PDF', async () => {
    const buffer = await service.generateGiftCardPdf(validParams);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  it('calls QRCode.toBuffer with the provided qrUrl', async () => {
    await service.generateGiftCardPdf(validParams);
    expect(mockedQRCode.toBuffer).toHaveBeenCalledWith(validParams.qrUrl, {
      type: 'png',
      width: 150,
    });
  });

  it('propagates QRCode.toBuffer rejection', async () => {
    (mockedQRCode.toBuffer as jest.Mock).mockRejectedValue(
      new Error('qr error'),
    );
    await expect(service.generateGiftCardPdf(validParams)).rejects.toThrow(
      'qr error',
    );
  });
});
