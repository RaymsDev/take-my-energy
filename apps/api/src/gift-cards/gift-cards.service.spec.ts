import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { CatalogRegistryService } from '../catalog/catalog.service';
import { EmailService } from '../email/email.service';

// Prevent transitive pdfkit/qrcode resolution before packages are installed
jest.mock('../pdf/pdf.service', () => ({ PdfService: class PdfService {} }));
import { PdfService } from '../pdf/pdf.service';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardModel } from './schemas/gift-card.schema';

const mockCatalogEntry = {
  id: '1',
  title: 'Massage Holistique',
  price: 65,
  currency: 'EUR',
  duration: { value: 60, unitText: 'min' },
};

const mockPdfBuffer = Buffer.from('%PDF-mock');

const buildMockCard = (overrides: object = {}) => ({
  _id: 'card-id',
  status: 'active',
  code: 'some-uuid',
  serviceName: mockCatalogEntry.title,
  servicePrice: mockCatalogEntry.price,
  ...overrides,
});

const buildModel = (overrides: object = {}) => {
  const card = buildMockCard(overrides);
  const redeemedCard = { ...card, status: 'redeemed', redeemedAt: new Date() };
  return {
    create: jest.fn().mockResolvedValue(card),
    find: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([card]),
    }),
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(card) }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(redeemedCard),
    }),
  };
};

describe('GiftCardsService', () => {
  let service: GiftCardsService;
  let model: ReturnType<typeof buildModel>;
  let catalogRegistry: { findById: jest.Mock };
  let emailService: { sendGiftCard: jest.Mock };
  let pdfService: { generateGiftCardPdf: jest.Mock };
  let configService: { get: jest.Mock };

  const rebuild = async (modelOverrides: object = {}) => {
    model = buildModel(modelOverrides);
    catalogRegistry = {
      findById: jest.fn().mockResolvedValue(mockCatalogEntry),
    };
    emailService = { sendGiftCard: jest.fn().mockResolvedValue(undefined) };
    pdfService = {
      generateGiftCardPdf: jest.fn().mockResolvedValue(mockPdfBuffer),
    };
    configService = {
      get: jest.fn().mockReturnValue('https://cinqdecoeur.fr'),
    };

    const module = await Test.createTestingModule({
      providers: [
        GiftCardsService,
        { provide: getModelToken(GiftCardModel.name), useValue: model },
        { provide: CatalogRegistryService, useValue: catalogRegistry },
        { provide: EmailService, useValue: emailService },
        { provide: PdfService, useValue: pdfService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    service = module.get(GiftCardsService);
  };

  beforeEach(() => rebuild());

  const validDto = {
    recipientName: 'Alice',
    recipientEmail: 'alice@example.com',
    senderName: 'Bob',
    serviceId: '1',
    message: undefined,
  };

  describe('create', () => {
    it('returns a card with code and status active for a valid serviceId', async () => {
      const result = await service.create(validDto);
      expect(result).toHaveProperty('code');
      expect(result.status).toBe('active');
      expect(result.serviceName).toBe(mockCatalogEntry.title);
      expect(result.servicePrice).toBe(mockCatalogEntry.price);
    });

    it('calls pdfService.generateGiftCardPdf with a QR URL containing the service id', async () => {
      await service.create(validDto);
      expect(pdfService.generateGiftCardPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          qrUrl: expect.stringContaining(
            `/cadeau/service/${mockCatalogEntry.id}`,
          ),
        }),
      );
    });

    it('calls emailService.sendGiftCard with the pdfBuffer', async () => {
      await service.create(validDto);
      expect(emailService.sendGiftCard).toHaveBeenCalledWith(
        expect.objectContaining({ pdfBuffer: mockPdfBuffer }),
      );
    });

    it('throws NotFoundException when serviceId is not in catalog', async () => {
      catalogRegistry.findById.mockResolvedValue(null);
      await expect(
        service.create({ ...validDto, serviceId: 'bad-id' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the card even when PDF generation fails (best-effort)', async () => {
      pdfService.generateGiftCardPdf.mockRejectedValue(new Error('pdf error'));
      const result = await service.create(validDto);
      expect(model.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('code');
    });

    it('returns the card even when email delivery fails (best-effort)', async () => {
      emailService.sendGiftCard.mockRejectedValue(new Error('Resend down'));
      const result = await service.create(validDto);
      expect(model.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('code');
    });
  });

  describe('findAll', () => {
    it('returns an array of gift cards', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns the card when found', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('_id', 'card-id');
    });

    it('throws NotFoundException when id does not exist', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an invalid ObjectId', async () => {
      await expect(service.findOne('not-a-valid-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('redeem', () => {
    it('sets status to redeemed and sets redeemedAt', async () => {
      const result = await service.redeem('507f1f77bcf86cd799439011');
      expect(result.status).toBe('redeemed');
      expect(result.redeemedAt).toBeDefined();
    });

    it('is idempotent — returns card unchanged if already redeemed', async () => {
      const redeemedCard = buildMockCard({
        status: 'redeemed',
        redeemedAt: new Date('2024-01-01'),
      });
      model.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(redeemedCard),
      });
      const result = await service.redeem('507f1f77bcf86cd799439011');
      expect((result as typeof redeemedCard).redeemedAt).toEqual(
        new Date('2024-01-01'),
      );
    });

    it('throws NotFoundException when card does not exist', async () => {
      model.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.redeem('507f1f77bcf86cd799439011'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an invalid ObjectId', async () => {
      await expect(service.redeem('not-a-valid-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
