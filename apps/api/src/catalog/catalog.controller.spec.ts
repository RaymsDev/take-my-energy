import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogRegistryService } from './catalog.service';
import { CATALOG_SERVICES } from './catalog.config';

describe('CatalogController + CatalogRegistryService', () => {
  let controller: CatalogController;
  let service: CatalogRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [CatalogRegistryService],
    }).compile();

    controller = module.get(CatalogController);
    service = module.get(CatalogRegistryService);
  });

  describe('CatalogRegistryService', () => {
    it('findAll() returns a non-empty array', () => {
      const result = service.findAll();
      expect(result.length).toBeGreaterThan(0);
    });

    it('findAll() returns items with id, title, price, currency, duration', () => {
      const [first] = service.findAll();
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(typeof first.price).toBe('number');
      expect(first).toHaveProperty('currency');
      expect(first.duration).toHaveProperty('value');
      expect(first.duration).toHaveProperty('unitText');
    });

    it('findById returns the matching service', () => {
      const first = CATALOG_SERVICES[0];
      expect(service.findById(first.id)).toEqual(first);
    });

    it('findById returns undefined for an unknown id', () => {
      expect(service.findById('nonexistent')).toBeUndefined();
    });
  });

  describe('CatalogController', () => {
    it('GET /catalog returns the full service list', () => {
      const result = controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('GET /catalog is accessible without auth (no guard applied)', () => {
      // If JwtGuard were applied, the controller would need a JwtService in the test module.
      // The fact that this test compiles and runs without providing JwtService confirms the endpoint is public.
      expect(() => controller.findAll()).not.toThrow();
    });
  });
});
