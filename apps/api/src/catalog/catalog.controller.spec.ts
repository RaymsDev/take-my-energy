import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogRegistryService } from './catalog.service';

const mockServices = [
  {
    id: '1',
    title: 'Soins énergétiques',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '2',
    title: 'Massage Holistique',
    price: 65,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
];

const mockCatalogService = {
  findAll: jest.fn().mockResolvedValue(mockServices),
  findById: jest.fn(),
};

describe('CatalogController', () => {
  let controller: CatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        { provide: CatalogRegistryService, useValue: mockCatalogService },
      ],
    }).compile();

    controller = module.get(CatalogController);
    jest.clearAllMocks();
    mockCatalogService.findAll.mockResolvedValue(mockServices);
  });

  describe('findAll', () => {
    it('returns the full service array from the registry', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockServices);
      expect(mockCatalogService.findAll).toHaveBeenCalledTimes(1);
    });

    it('is accessible without auth (no guard applied)', async () => {
      await expect(controller.findAll()).resolves.toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns the service when found', async () => {
      mockCatalogService.findById.mockResolvedValue(mockServices[0]);
      const result = await controller.findOne('1');
      expect(result).toEqual(mockServices[0]);
      expect(mockCatalogService.findById).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when service does not exist', async () => {
      mockCatalogService.findById.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('CatalogRegistryService', () => {
  it('findAll() resolves to items with id, title, price, currency, duration', async () => {
    const result = await mockCatalogService.findAll();
    const [first] = result;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(typeof first.price).toBe('number');
    expect(first).toHaveProperty('currency');
    expect(first.duration).toHaveProperty('value');
    expect(first.duration).toHaveProperty('unitText');
  });
});
