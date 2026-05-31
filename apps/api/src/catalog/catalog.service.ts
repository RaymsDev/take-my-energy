import { Injectable } from '@nestjs/common';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import { CATALOG_SERVICES } from './catalog.config';

@Injectable()
export class CatalogRegistryService {
  findAll(): CatalogService[] {
    return CATALOG_SERVICES;
  }

  findById(id: string): CatalogService | undefined {
    return CATALOG_SERVICES.find((s) => s.id === id);
  }
}
