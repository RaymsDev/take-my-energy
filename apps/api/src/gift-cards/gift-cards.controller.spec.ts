import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';

const mockCard = {
  _id: VALID_OBJECT_ID,
  status: 'active' as const,
  code: 'test-uuid',
  serviceName: 'Massage Holistique',
  servicePrice: 65,
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  senderName: 'Bob',
};

const redeemedCard = {
  ...mockCard,
  status: 'redeemed' as const,
  redeemedAt: new Date('2024-01-01'),
};

const validDto = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  senderName: 'Bob',
  serviceId: '1',
};

describe('GiftCardsController', () => {
  let controller: GiftCardsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    redeem: jest.Mock;
  };

  const buildModule = async (
    guardCanActivate: () => boolean | Promise<boolean> = () => true,
  ): Promise<void> => {
    service = {
      create: jest.fn().mockResolvedValue(mockCard),
      findAll: jest.fn().mockResolvedValue([mockCard]),
      findOne: jest.fn().mockResolvedValue(mockCard),
      redeem: jest.fn().mockResolvedValue(redeemedCard),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiftCardsController],
      providers: [{ provide: GiftCardsService, useValue: service }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: guardCanActivate })
      .compile();

    controller = module.get(GiftCardsController);
  };

  beforeEach(() => buildModule());

  describe('create', () => {
    it('delegates to service and returns the created card', async () => {
      const result = await controller.create(validDto as never);
      expect(service.create).toHaveBeenCalledWith(validDto);
      expect(result).toHaveProperty('code');
      expect(result.status).toBe('active');
      expect(result.serviceName).toBe('Massage Holistique');
      expect(result.servicePrice).toBe(65);
    });

    it('propagates NotFoundException when service reports unknown serviceId', async () => {
      service.create.mockRejectedValue(
        new NotFoundException('Service not found'),
      );
      await expect(controller.create(validDto as never)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('returns an array of gift cards', async () => {
      const result = await controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('passes limit and page to service when provided', async () => {
      await controller.findAll('10', '2');
      expect(service.findAll).toHaveBeenCalledWith(10, 2);
    });

    it('uses defaults (100, 1) when limit and page are omitted', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(100, 1);
    });
  });

  describe('findOne', () => {
    it('returns the card for a valid id', async () => {
      const result = await controller.findOne(VALID_OBJECT_ID);
      expect(result).toHaveProperty('_id', VALID_OBJECT_ID);
      expect(service.findOne).toHaveBeenCalledWith(VALID_OBJECT_ID);
    });

    it('propagates NotFoundException for a non-existent id', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Gift card not found'),
      );
      await expect(controller.findOne('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('redeem', () => {
    it('returns the redeemed card with status and redeemedAt set', async () => {
      const result = await controller.redeem(VALID_OBJECT_ID);
      expect(result.status).toBe('redeemed');
      expect((result as typeof redeemedCard).redeemedAt).toBeDefined();
    });

    it('is idempotent — returns already-redeemed card unchanged', async () => {
      service.redeem.mockResolvedValue(redeemedCard);
      const result = await controller.redeem(VALID_OBJECT_ID);
      expect((result as typeof redeemedCard).redeemedAt).toEqual(
        new Date('2024-01-01'),
      );
    });

    it('propagates NotFoundException for a non-existent id', async () => {
      service.redeem.mockRejectedValue(
        new NotFoundException('Gift card not found'),
      );
      await expect(controller.redeem('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('JWT guard enforcement', () => {
    it('applies JwtGuard to the controller class', () => {
      // Guards are invoked by the NestJS HTTP pipeline, not by direct method calls.
      // Verify the decorator is present so any route change that removes it is caught here.
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', GiftCardsController) ?? [];
      expect(guards).toContain(JwtGuard);
    });
  });
});
