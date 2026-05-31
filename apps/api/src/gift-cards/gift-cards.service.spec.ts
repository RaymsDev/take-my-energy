import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { CatalogRegistryService } from '../catalog/catalog.service';
import { EmailService } from '../email/email.service';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardModel } from './schemas/gift-card.schema';

const mockService = {
  id: '1',
  title: 'Massage Holistique',
  price: 65,
  currency: 'EUR',
  duration: { value: 60, unitText: 'min' },
};

const buildMockCard = (overrides: object = {}) => ({
  _id: 'card-id',
  status: 'active',
  code: 'some-uuid',
  serviceName: mockService.title,
  servicePrice: mockService.price,
  ...overrides,
});

const buildModel = (overrides: object = {}) => {
  const card = buildMockCard(overrides);
  return {
    create: jest.fn().mockResolvedValue(card),
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([card]) }),
    findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(card) }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...card, status: 'redeemed', redeemedAt: new Date() }),
    }),
  };
};

describe('GiftCardsService', () => {
  let service: GiftCardsService;
  let model: ReturnType<typeof buildModel>;
  let catalogRegistry: { findById: jest.Mock };
  let emailService: { sendGiftCard: jest.Mock };

  const rebuild = async (modelOverrides: object = {}) => {
    model = buildModel(modelOverrides);
    catalogRegistry = { findById: jest.fn().mockReturnValue(mockService) };
    emailService = { sendGiftCard: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        GiftCardsService,
        { provide: getModelToken(GiftCardModel.name), useValue: model },
        { provide: CatalogRegistryService, useValue: catalogRegistry },
        { provide: EmailService, useValue: emailService },
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
      expect(result.serviceName).toBe(mockService.title);
      expect(result.servicePrice).toBe(mockService.price);
    });

    it('calls emailService.sendGiftCard after saving', async () => {
      await service.create(validDto);
      expect(emailService.sendGiftCard).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when serviceId is not in catalog', async () => {
      catalogRegistry.findById.mockReturnValue(undefined);
      await expect(service.create({ ...validDto, serviceId: 'bad-id' }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('persists the card even when email dispatch throws (best-effort email)', async () => {
      emailService.sendGiftCard.mockRejectedValue(new Error('Resend down'));
      await expect(service.create(validDto)).rejects.toThrow('Resend down');
      // Card was saved before email call
      expect(model.create).toHaveBeenCalledTimes(1);
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
      const result = await service.findOne('card-id');
      expect(result).toHaveProperty('_id', 'card-id');
    });

    it('throws NotFoundException when id does not exist', async () => {
      model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('redeem', () => {
    it('sets status to redeemed and sets redeemedAt', async () => {
      const result = await service.redeem('card-id');
      expect(result.status).toBe('redeemed');
      expect(result.redeemedAt).toBeDefined();
    });

    it('is idempotent — returns card unchanged if already redeemed', async () => {
      const redeemedCard = buildMockCard({ status: 'redeemed', redeemedAt: new Date('2024-01-01') });
      model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(redeemedCard) });
      const result = await service.redeem('card-id');
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
      expect((result as typeof redeemedCard).redeemedAt).toEqual(new Date('2024-01-01'));
    });

    it('throws NotFoundException when card does not exist', async () => {
      model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.redeem('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
